"use node";

import { randomBytes } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { requireUserId } from "./_lib/auth";
import type { Doc, Id } from "./_generated/dataModel";
import type { FormLanguage } from "../lib/validation/dental-form";
import { formatProjectDate } from "../lib/date-utils";

const TOKEN_EXPIRY_HOURS = 72;
const TRANSLATABLE_LANGUAGES: Record<Exclude<FormLanguage, "en">, string> = {
    es: "Spanish",
    ar: "Arabic",
    "zh-Hans": "Simplified Chinese",
    "zh-Hant": "Traditional Chinese",
};

type FormTemplateDoc = Doc<"formTemplates">;
type LocalizedTemplateSnapshot = NonNullable<
    Doc<"formDeliveries">["localizedTemplate"]
>;

function generateSecureToken(): string {
    return randomBytes(32)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function extractJsonObject(text: string): unknown {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Could not parse translation response");
    }

    return JSON.parse(jsonMatch[0]);
}

function getTranslatedString(
    source: string,
    value: unknown,
    { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
    if (typeof value !== "string") {
        return source;
    }

    if (allowEmpty) {
        return value;
    }

    return value.trim() ? value : source;
}

function getOptionalTranslatedString(
    source: string | undefined,
    value: unknown,
): string | undefined {
    if (source === undefined) {
        return undefined;
    }

    return typeof value === "string" ? value : source;
}

function buildLocalizedTemplateSnapshot(
    template: FormTemplateDoc,
    language: Exclude<FormLanguage, "en">,
    candidate: unknown,
): LocalizedTemplateSnapshot {
    const translated = candidate as {
        name?: unknown;
        description?: unknown;
        consentText?: unknown;
        sections?: Array<{
            title?: unknown;
            description?: unknown;
            fields?: Array<{
                label?: unknown;
                placeholder?: unknown;
                options?: unknown;
            }>;
        }>;
    };

    return {
        language,
        name: getTranslatedString(template.name, translated?.name),
        description: getOptionalTranslatedString(
            template.description,
            translated?.description,
        ),
        consentText: getTranslatedString(
            template.consentText,
            translated?.consentText,
        ),
        consentVersion: template.consentVersion,
        sections: template.sections.map((section, sectionIndex) => {
            const translatedSection = translated?.sections?.[sectionIndex];

            return {
                ...section,
                title: getTranslatedString(
                    section.title,
                    translatedSection?.title,
                ),
                description: getOptionalTranslatedString(
                    section.description,
                    translatedSection?.description,
                ),
                fields: section.fields.map((field, fieldIndex) => {
                    const translatedField =
                        translatedSection?.fields?.[fieldIndex];
                    const translatedOptions = Array.isArray(
                        translatedField?.options,
                    )
                        ? translatedField.options
                        : undefined;

                    return {
                        ...field,
                        label: getTranslatedString(
                            field.label,
                            translatedField?.label,
                        ),
                        placeholder: getOptionalTranslatedString(
                            field.placeholder,
                            translatedField?.placeholder,
                        ),
                        options: field.options?.map((option, optionIndex) =>
                            getTranslatedString(
                                option,
                                translatedOptions?.[optionIndex],
                            ),
                        ),
                    };
                }),
            };
        }),
    };
}

async function localizeTemplate(
    template: FormTemplateDoc,
    language: FormLanguage,
): Promise<LocalizedTemplateSnapshot | undefined> {
    if (language === "en") {
        return undefined;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new ConvexError({
            code: "CONFIGURATION_ERROR",
            message:
                "GEMINI_API_KEY is required to generate translated patient forms",
        });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const languageName = TRANSLATABLE_LANGUAGES[language];
    const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: [
                            `Translate this patient intake form JSON from English to ${languageName}.`,
                            "Rules:",
                            "- Return JSON only.",
                            "- Keep the exact array order and object structure.",
                            "- Do not change ids, types, enabled, required, validation, or consentVersion.",
                            "- Translate only patient-facing text fields: name, description, consentText, section titles/descriptions, field labels/placeholders, and field options.",
                            "- Preserve blank strings as blank strings.",
                            "- Keep the output professional and suitable for a medical intake form.",
                            "",
                            JSON.stringify({
                                name: template.name,
                                description: template.description,
                                consentText: template.consentText,
                                consentVersion: template.consentVersion,
                                sections: template.sections.map((section) => ({
                                    id: section.id,
                                    title: section.title,
                                    description: section.description,
                                    enabled: section.enabled,
                                    fields: section.fields.map((field) => ({
                                        id: field.id,
                                        type: field.type,
                                        label: field.label,
                                        placeholder: field.placeholder,
                                        required: field.required,
                                        options: field.options,
                                        validation: field.validation,
                                    })),
                                })),
                            }),
                        ].join("\n"),
                    },
                ],
            },
        ],
    });

    if (!response.text) {
        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message: "Translation service returned an empty response",
        });
    }

    try {
        return buildLocalizedTemplateSnapshot(
            template,
            language,
            extractJsonObject(response.text),
        );
    } catch (error) {
        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to parse translated form content",
        });
    }
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
        preferredLanguage: v.optional(
            v.union(
                v.literal("en"),
                v.literal("es"),
                v.literal("ar"),
                v.literal("zh-Hans"),
                v.literal("zh-Hant"),
            ),
        ),
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
        const preferredLanguage = args.preferredLanguage ?? "en";
        const localizedTemplate = await localizeTemplate(
            template,
            preferredLanguage,
        );

        const deliveryId: Id<"formDeliveries"> = await ctx.runMutation(
            internal.formDeliveries.insertDelivery,
            {
                clientId: args.clientId,
                templateId: args.templateId,
                channel: args.channel,
                token,
                tokenExpiresAt,
                preferredLanguage,
                localizedTemplate,
                createdBy: userId,
            },
        );

        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const languageQuery =
            preferredLanguage === "en" ? "" : `?lang=${preferredLanguage}`;
        const formUrl = `${appUrl}/form/${token}${languageQuery}`;

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
    const expiryDate = formatProjectDate(opts.expiresAt);
    const greeting = opts.patientName ? `Hi ${opts.patientName},` : "Hello,";

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
