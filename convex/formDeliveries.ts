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
