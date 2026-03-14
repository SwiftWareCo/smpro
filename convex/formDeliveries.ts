import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import * as DentalFormsWrite from "./db/dentalForms/write";
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

export const insertDelivery = internalMutation({
    args: {
        clientId: v.id("clients"),
        templateId: v.id("formTemplates"),
        channel: v.union(
            v.literal("email"),
            v.literal("sms"),
            v.literal("qr"),
            v.literal("link"),
            v.literal("tablet"),
        ),
        token: v.string(),
        tokenExpiresAt: v.number(),
        preferredLanguage: v.union(
            v.literal("en"),
            v.literal("es"),
            v.literal("ar"),
            v.literal("zh-Hans"),
            v.literal("zh-Hant"),
        ),
        localizedTemplate: v.optional(
            v.object({
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
                            }),
                        ),
                    }),
                ),
                consentText: v.string(),
                consentVersion: v.string(),
            }),
        ),
        createdBy: v.string(),
    },
    handler: async (ctx, args) => {
        const deliveryId = await DentalFormsWrite.createDelivery(ctx, {
            clientId: args.clientId,
            templateId: args.templateId,
            channel: args.channel,
            token: args.token,
            tokenExpiresAt: args.tokenExpiresAt,
            preferredLanguage: args.preferredLanguage,
            localizedTemplate: args.localizedTemplate,
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
                preferredLanguage: args.preferredLanguage,
            },
        });

        return deliveryId;
    },
});
