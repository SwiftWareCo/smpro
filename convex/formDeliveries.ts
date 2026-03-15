import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import * as DentalFormsWrite from "./db/dentalForms/write";
import * as DentalFormsRead from "./db/dentalForms/read";
import { requireClientAccess } from "./_lib/auth";
import { logAuditEvent } from "./_lib/audit";

export const updateDeliveryStatus = internalMutation({
    args: {
        deliveryId: v.id("formDeliveries"),
        status: v.union(
            v.literal("pending"),
            v.literal("sent"),
            v.literal("delivered"),
            v.literal("opened"),
            v.literal("completed"),
            v.literal("expired"),
            v.literal("failed"),
        ),
    },
    handler: async (ctx, args) => {
        await DentalFormsWrite.patchDelivery(ctx, args.deliveryId, {
            status: args.status,
        });
    },
});

const localizedTemplateValidator = v.object({
    language: v.union(
        v.literal("en"),
        v.literal("es"),
        v.literal("ar"),
        v.literal("zh-Hans"),
        v.literal("zh-Hant"),
    ),
    name: v.string(),
    description: v.optional(v.string()),
    sections: v.array(
        v.object({
            id: v.string(),
            title: v.string(),
            description: v.optional(v.string()),
            enabled: v.boolean(),
            fields: v.array(
                v.object({
                    id: v.string(),
                    type: v.union(
                        v.literal("text"),
                        v.literal("textarea"),
                        v.literal("email"),
                        v.literal("phone"),
                        v.literal("date"),
                        v.literal("select"),
                        v.literal("radio"),
                        v.literal("checkbox"),
                        v.literal("number"),
                        v.literal("signature"),
                        v.literal("address"),
                    ),
                    label: v.string(),
                    placeholder: v.optional(v.string()),
                    required: v.boolean(),
                    options: v.optional(v.array(v.string())),
                    validation: v.optional(
                        v.object({
                            min: v.optional(v.number()),
                            max: v.optional(v.number()),
                            pattern: v.optional(v.string()),
                            message: v.optional(v.string()),
                        }),
                    ),
                    followUp: v.optional(
                        v.object({
                            enabled: v.boolean(),
                            trigger: v.string(),
                            label: v.string(),
                            required: v.boolean(),
                        }),
                    ),
                }),
            ),
        }),
    ),
    consentText: v.string(),
    consentVersion: v.string(),
});

export const insertDelivery = internalMutation({
    args: {
        clientId: v.id("clients"),
        templateId: v.id("formTemplates"),
        patientName: v.optional(v.string()),
        channel: v.union(
            v.literal("email"),
            v.literal("sms"),
            v.literal("qr"),
            v.literal("link"),
            v.literal("tablet"),
        ),
        token: v.string(),
        tokenExpiresAt: v.number(),
        preferredLanguage: v.optional(
            v.union(
                v.literal("en"),
                v.literal("es"),
                v.literal("ar"),
                v.literal("zh-Hans"),
                v.literal("zh-Hant"),
            ),
        ),
        localizedTemplate: v.optional(localizedTemplateValidator),
        localizedTemplates: v.optional(v.array(localizedTemplateValidator)),
        createdBy: v.string(),
    },
    handler: async (ctx, args) => {
        const deliveryId = await DentalFormsWrite.createDelivery(ctx, {
            clientId: args.clientId,
            templateId: args.templateId,
            patientName: args.patientName,
            channel: args.channel,
            token: args.token,
            tokenExpiresAt: args.tokenExpiresAt,
            preferredLanguage: args.preferredLanguage,
            localizedTemplate: args.localizedTemplate,
            localizedTemplates: args.localizedTemplates,
            createdBy: args.createdBy,
        });

        await logAuditEvent(ctx, {
            actor: args.createdBy,
            actorType: "user",
            action: "form_delivery.create",
            resource: "formDeliveries",
            resourceId: deliveryId,
            clientId: args.clientId,
            metadata: {
                channel: args.channel,
                preferredLanguage: args.preferredLanguage ?? "patient_choice",
            },
        });

        return deliveryId;
    },
});

export const getActiveForTemplate = query({
    args: {
        clientId: v.id("clients"),
        templateId: v.id("formTemplates"),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);

        const delivery =
            await DentalFormsRead.getLatestActiveDeliveryForTemplate(
                ctx,
                args.clientId,
                args.templateId,
            );

        if (!delivery) return null;

        return {
            deliveryId: delivery._id,
            token: delivery.token,
            channel: delivery.channel,
            preferredLanguage: delivery.preferredLanguage,
            expiresAt: delivery.tokenExpiresAt,
            createdAt: delivery.createdAt,
            status: delivery.status,
        };
    },
});

export const revoke = mutation({
    args: { deliveryId: v.id("formDeliveries") },
    handler: async (ctx, args) => {
        const delivery = await ctx.db.get(args.deliveryId);
        if (!delivery) throw new Error("Delivery not found");
        await requireClientAccess(ctx, delivery.clientId);
        await ctx.db.patch(args.deliveryId, {
            status: "expired",
            updatedAt: Date.now(),
        });
    },
});

export const listForTemplate = query({
    args: {
        clientId: v.id("clients"),
        templateId: v.id("formTemplates"),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);

        const deliveries =
            await DentalFormsRead.listDeliveriesByClientTemplate(
                ctx,
                args.clientId,
                args.templateId,
            );

        return deliveries.map((d) => ({
            deliveryId: d._id,
            token: d.token,
            channel: d.channel,
            patientName: d.patientName,
            status: d.status,
            createdAt: d.createdAt,
            tokenExpiresAt: d.tokenExpiresAt,
        }));
    },
});
