"use node";

import { GoogleGenAI } from "@google/genai";
import { ConvexError, v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { Doc } from "./_generated/dataModel";
import type { FormLanguage } from "../lib/validation/dental-form";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";
const OPENROUTER_FALLBACK_MODEL = "arcee-ai/trinity-large-preview:free";

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

function extractJsonObject(text: string): unknown {
    // Strip markdown code fences if present
    let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    // Try direct parse first
    try {
        return JSON.parse(cleaned);
    } catch {
        // Fallback: extract outermost balanced braces
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) {
            throw new Error("Could not parse translation response");
        }
        return JSON.parse(cleaned.slice(start, end + 1));
    }
}

function getTranslatedString(
    source: string,
    value: unknown,
    { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
    if (typeof value !== "string") return source;
    if (allowEmpty) return value;
    return value.trim() ? value : source;
}

function getOptionalTranslatedString(
    source: string | undefined,
    value: unknown,
): string | undefined {
    if (source === undefined) return undefined;
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
                followUps?: Array<{
                    label?: unknown;
                    placeholder?: unknown;
                    options?: unknown;
                }>;
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
        // Consent is hardcoded — use English consent text (patient sees i18n version from frontend)
        consentText: template.consentText,
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

                    const translatedFollowUps = field.followUps?.map(
                        (fu, fuIndex) => {
                            const translatedFu =
                                translatedField?.followUps?.[fuIndex];
                            const translatedFuOptions = Array.isArray(
                                translatedFu?.options,
                            )
                                ? translatedFu.options
                                : undefined;

                            return {
                                ...fu,
                                label: getTranslatedString(
                                    fu.label,
                                    translatedFu?.label,
                                ),
                                placeholder: getOptionalTranslatedString(
                                    fu.placeholder,
                                    translatedFu?.placeholder,
                                ),
                                options: fu.options?.map(
                                    (option, optionIndex) =>
                                        getTranslatedString(
                                            option,
                                            translatedFuOptions?.[optionIndex],
                                        ),
                                ),
                            };
                        },
                    );

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
                        followUps: translatedFollowUps,
                    };
                }),
            };
        }),
    };
}

function isRetryableGeminiError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return (
        message.includes("rate limit") ||
        message.includes("quota") ||
        message.includes("resource exhausted") ||
        message.includes("429") ||
        message.includes("503") ||
        message.includes("overloaded") ||
        message.includes("capacity")
    );
}

interface TranslationResult {
    snapshot: LocalizedTemplateSnapshot;
    usage: { promptTokens: number; completionTokens: number };
}

async function localizeTemplateWithGemini(
    prompt: string,
    template: FormTemplateDoc,
    language: Exclude<FormLanguage, "en">,
): Promise<TranslationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new ConvexError({
            code: "CONFIGURATION_ERROR",
            message:
                "GEMINI_API_KEY is required to generate translated patient forms",
        });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });

    const content = response.text;
    if (!content) {
        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message: "Gemini returned an empty response",
        });
    }

    return {
        snapshot: buildLocalizedTemplateSnapshot(
            template,
            language,
            extractJsonObject(content),
        ),
        usage: {
            promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
            completionTokens:
                response.usageMetadata?.candidatesTokenCount ?? 0,
        },
    };
}

async function localizeTemplateWithOpenRouterFallback(
    prompt: string,
    template: FormTemplateDoc,
    language: Exclude<FormLanguage, "en">,
): Promise<TranslationResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message:
                "Gemini hit a retryable limit and OPENROUTER_API_KEY is not configured for fallback",
        });
    }

    const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: OPENROUTER_FALLBACK_MODEL,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message: `OpenRouter fallback API error (${response.status}) for ${language}: ${errorBody.slice(0, 500)}`,
        });
    }

    const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message: "OpenRouter fallback returned an empty response",
        });
    }

    return {
        snapshot: buildLocalizedTemplateSnapshot(
            template,
            language,
            extractJsonObject(content),
        ),
        usage: {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
        },
    };
}

async function localizeTemplate(
    template: FormTemplateDoc,
    language: Exclude<FormLanguage, "en">,
): Promise<TranslationResult> {
    const languageName = TRANSLATABLE_LANGUAGES[language];
    const prompt = [
        `Translate this patient intake form JSON from English to ${languageName}.`,
        "Rules:",
        "- Return JSON only.",
        "- Keep the exact array order and object structure.",
        "- Do not change ids, types, enabled, required, validation, or consentVersion.",
        "- Translate only patient-facing text fields: name, description, section titles/descriptions, field labels/placeholders, and field options.",
        "- Do NOT translate the consentText field — leave it exactly as-is.",
        "- Preserve blank strings as blank strings.",
        "- Keep the output professional and suitable for a medical intake form.",
        "",
        JSON.stringify({
            name: template.name,
            description: template.description,
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
                    followUps: field.followUps?.map((fu) => ({
                        id: fu.id,
                        type: fu.type,
                        label: fu.label,
                        placeholder: fu.placeholder,
                        options: fu.options,
                    })),
                })),
            })),
        }),
    ].join("\n");

    try {
        return await localizeTemplateWithGemini(prompt, template, language);
    } catch (error) {
        if (isRetryableGeminiError(error)) {
            return await localizeTemplateWithOpenRouterFallback(
                prompt,
                template,
                language,
            );
        }

        throw new ConvexError({
            code: "TRANSLATION_FAILED",
            message:
                error instanceof Error
                    ? `Gemini translation failed for ${language}: ${error.message}`
                    : "Failed to translate form content",
        });
    }
}

export const translateTemplate = internalAction({
    args: {
        templateId: v.id("formTemplates"),
    },
    handler: async (ctx, args) => {
        const template = await ctx.runQuery(api.formTemplates.getInternal, {
            templateId: args.templateId,
        });
        if (!template) {
            console.error(
                `translateTemplate: template ${args.templateId} not found`,
            );
            return;
        }

        const nonEnglishLangs = Object.keys(
            TRANSLATABLE_LANGUAGES,
        ) as (keyof typeof TRANSLATABLE_LANGUAGES)[];

        try {
            const results: LocalizedTemplateSnapshot[] = [];
            let totalPromptTokens = 0;
            let totalCompletionTokens = 0;
            for (const lang of nonEnglishLangs) {
                const result = await localizeTemplate(template, lang);
                results.push(result.snapshot);
                totalPromptTokens += result.usage.promptTokens;
                totalCompletionTokens += result.usage.completionTokens;
            }

            await ctx.runMutation(internal.formTemplates.patchTranslations, {
                templateId: args.templateId,
                translations: results,
                translatedAt: Date.now(),
            });

            // Track translation usage
            try {
                await ctx.runMutation(internal.usage.trackUsage, {
                    clientId: template.clientId as Id<"clients">,
                    service: "form_translation",
                    callCount: nonEnglishLangs.length,
                    promptTokens: totalPromptTokens,
                    completionTokens: totalCompletionTokens,
                });
            } catch (e) {
                console.error("Form translation usage tracking failed:", e);
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown translation failure";

            await ctx.runMutation(internal.formTemplates.setTranslationFailed, {
                templateId: args.templateId,
                translationError: message.slice(0, 500),
            });

            throw error;
        }
    },
});
