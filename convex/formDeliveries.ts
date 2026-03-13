import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireClientAccess } from "./_lib/auth";
import * as DentalFormsRead from "./db/dentalForms/read";
import * as DentalFormsWrite from "./db/dentalForms/write";
import { logAuditEvent } from "./_lib/audit";

export const list = query({
    args: {
        clientId: v.id("clients"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return DentalFormsRead.listDeliveriesByClient(
            ctx,
            args.clientId,
            args.limit ?? 50,
        );
    },
});

export const listByTemplate = query({
    args: {
        templateId: v.id("formTemplates"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const template = await DentalFormsRead.getTemplateById(
            ctx,
            args.templateId,
        );
        if (!template) throw new Error("Template not found");
        await requireClientAccess(ctx, template.clientId);
        return DentalFormsRead.listDeliveriesByTemplate(
            ctx,
            args.templateId,
            args.limit ?? 50,
        );
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
        createdBy: v.string(),
    },
    handler: async (ctx, args) => {
        const deliveryId = await DentalFormsWrite.createDelivery(ctx, {
            clientId: args.clientId,
            templateId: args.templateId,
            channel: args.channel,
            token: args.token,
            tokenExpiresAt: args.tokenExpiresAt,
            createdBy: args.createdBy,
        });

        await logAuditEvent(ctx, {
            actor: args.createdBy,
            actorType: "user",
            action: "form_delivery.create",
            resource: "formDeliveries",
            resourceId: deliveryId,
            clientId: args.clientId,
            metadata: { channel: args.channel },
        });

        return deliveryId;
    },
});

export const updateDeliveryStatus = internalMutation({
    args: {
        deliveryId: v.id("formDeliveries"),
        status: v.union(
            v.literal("sent"),
            v.literal("delivered"),
            v.literal("opened"),
            v.literal("completed"),
            v.literal("expired"),
            v.literal("failed"),
        ),
        externalMessageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const patch: Record<string, unknown> = {
            status: args.status,
        };
        if (args.externalMessageId) {
            patch.externalMessageId = args.externalMessageId;
        }

        const now = Date.now();
        if (args.status === "sent") patch.sentAt = now;
        if (args.status === "delivered") patch.deliveredAt = now;
        if (args.status === "opened") patch.openedAt = now;
        if (args.status === "completed") patch.completedAt = now;

        await DentalFormsWrite.patchDelivery(ctx, args.deliveryId, patch);
        return { success: true };
    },
});
