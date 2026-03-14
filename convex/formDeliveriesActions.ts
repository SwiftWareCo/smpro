"use node";

import { randomBytes } from "node:crypto";
import { Resend } from "resend";
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

function buildEmailHtml(opts: {
    clinicName: string;
    patientName?: string;
    formUrl: string;
    expiresAt: number;
}): string {
    const expiryDate = new Date(opts.expiresAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
    const greeting = opts.patientName
        ? `Hi ${opts.patientName},`
        : "Hello,";

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#18181b;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${opts.clinicName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#27272a;font-size:16px;line-height:1.5;">${greeting}</p>
          <p style="margin:0 0 24px;color:#27272a;font-size:16px;line-height:1.5;">
            ${opts.clinicName} has sent you a form to complete. Please click the button below to open and fill out the form.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${opts.formUrl}" target="_blank" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
                Complete Form
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#71717a;font-size:14px;line-height:1.5;">
            This link will expire on <strong>${expiryDate}</strong>.
          </p>
          <p style="margin:0;color:#71717a;font-size:14px;line-height:1.5;">
            If you did not expect this email, you can safely ignore it.
          </p>
        </td></tr>
        <tr><td style="background-color:#f4f4f5;padding:16px 32px;">
          <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
            Sent by ${opts.clinicName} via SMPro
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const sendEmail = action({
    args: {
        deliveryId: v.id("formDeliveries"),
        clientId: v.id("clients"),
        templateName: v.string(),
        recipientEmail: v.string(),
        patientName: v.optional(v.string()),
        formUrl: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        await requireUserId(ctx);

        const client = await ctx.runQuery(api.clients.get, {
            clientId: args.clientId,
        });
        const clinicName = client?.name ?? "Your Clinic";

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            await ctx.runMutation(
                internal.formDeliveries.updateDeliveryStatus,
                { deliveryId: args.deliveryId, status: "failed" },
            );
            throw new ConvexError({
                code: "CONFIGURATION_ERROR",
                message: "Email sending is not configured",
            });
        }

        const resend = new Resend(apiKey);
        const html = buildEmailHtml({
            clinicName,
            patientName: args.patientName,
            formUrl: args.formUrl,
            expiresAt: args.expiresAt,
        });

        try {
            await resend.emails.send({
                from: `${clinicName} <forms@swiftware.ca>`,
                to: args.recipientEmail,
                subject: `Complete your form — ${clinicName}`,
                html,
            });

            await ctx.runMutation(
                internal.formDeliveries.updateDeliveryStatus,
                { deliveryId: args.deliveryId, status: "sent" },
            );
        } catch (error) {
            await ctx.runMutation(
                internal.formDeliveries.updateDeliveryStatus,
                { deliveryId: args.deliveryId, status: "failed" },
            );
            throw new ConvexError({
                code: "EMAIL_SEND_FAILED",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to send email",
            });
        }
    },
});
