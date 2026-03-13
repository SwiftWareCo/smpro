"use node";

import { randomBytes } from "node:crypto";
import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { requireUserId } from "./_lib/auth";
import type { Id } from "./_generated/dataModel";

const TOKEN_EXPIRY_HOURS = 72;

function generateSecureToken(): string {
    return randomBytes(32)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export const createLink = action({
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
        expiryHours: v.optional(v.number()),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{
        deliveryId: Id<"formDeliveries">;
        token: string;
        formUrl: string;
        expiresAt: number;
    }> => {
        const userId = await requireUserId(ctx);
        const template = await ctx.runQuery(api.formTemplates.get, {
            templateId: args.templateId,
        });
        if (!template) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Template not found",
            });
        }
        if (template.clientId !== args.clientId) {
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Template does not belong to the selected client",
            });
        }

        const token = generateSecureToken();
        const expiryHours = args.expiryHours ?? TOKEN_EXPIRY_HOURS;
        const tokenExpiresAt = Date.now() + expiryHours * 60 * 60 * 1000;

        const deliveryId: Id<"formDeliveries"> = await ctx.runMutation(
            internal.formDeliveries.insertDelivery,
            {
                clientId: args.clientId,
                templateId: args.templateId,
                channel: args.channel,
                token,
                tokenExpiresAt,
                createdBy: userId,
            },
        );

        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const formUrl = `${appUrl}/form/${token}`;

        return {
            deliveryId,
            token,
            formUrl,
            expiresAt: tokenExpiresAt,
        };
    },
});
