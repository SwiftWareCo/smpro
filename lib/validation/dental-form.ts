import { z } from "zod";
import { FORM_LANGUAGES } from "@/lib/patient-form-i18n";
import {
    matchesFollowUpTrigger,
    parseMultipleChoiceValue,
} from "@/lib/multiple-choice";

export const fieldTypeSchema = z.enum([
    "text",
    "textarea",
    "email",
    "phone",
    "date",
    "select",
    "radio",
    "multiSelect",
    "number",
    "signature",
    "address",
    "paragraph",
]);

export const fieldValidationSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
});

export const paragraphStyleSchema = z.object({
    fontSize: z.enum(["sm", "base", "lg", "xl"]).optional(),
    bold: z.boolean().optional(),
});

export const followUpFieldSchema = z.object({
    id: z.string(),
    type: z.enum([
        "text",
        "textarea",
        "date",
        "number",
        "select",
        "radio",
        "multiSelect",
        "paragraph",
    ]),
    label: z.string(),
    placeholder: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    triggers: z.array(z.string()).min(1),
    width: z.enum(["third", "half", "full"]).optional(),
    paragraphStyle: paragraphStyleSchema.optional(),
});

export const templateFieldSchema = z.object({
    id: z.string(),
    type: fieldTypeSchema,
    label: z.string().min(1, "Field label is required"),
    placeholder: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    validation: fieldValidationSchema.optional(),
    followUps: z.array(followUpFieldSchema).max(5).optional(),
    width: z.enum(["third", "half", "full"]).optional(),
    paragraphStyle: paragraphStyleSchema.optional(),
});

export const templateSectionSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Section title is required"),
    description: z.string().optional(),
    enabled: z.boolean(),
    fields: z.array(templateFieldSchema),
});

export const createTemplateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Template name must be at least 2 characters")
        .max(100, "Template name must be 100 characters or fewer"),
    description: z.string().optional(),
    sections: z
        .array(templateSectionSchema)
        .min(1, "At least one section is required"),
    consentText: z.string().min(10, "Consent text is required"),
    consentVersion: z.string().min(1, "Consent version is required"),
});

export const submissionStatusSchema = z.enum([
    "submitted",
    "under_review",
    "approved",
    "exported",
    "entered_in_pms",
]);

export const deliveryChannelSchema = z.enum([
    "email",
    "sms",
    "qr",
    "link",
    "tablet",
]);

export const formLanguageSchema = z.enum(FORM_LANGUAGES);

export const MAX_SUBMISSION_SIZE_BYTES = 256 * 1024;
export const FOLLOW_UP_INFIX = "__fu__";

export function makeFollowUpKey(parentId: string, fuId: string): string {
    return `${parentId}${FOLLOW_UP_INFIX}${fuId}`;
}

export function parseFollowUpKey(
    key: string,
): { parentId: string; followUpId: string } | null {
    const idx = key.indexOf(FOLLOW_UP_INFIX);
    if (idx === -1) return null;
    return {
        parentId: key.slice(0, idx),
        followUpId: key.slice(idx + FOLLOW_UP_INFIX.length),
    };
}

export type SubmissionFieldMap = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateSubmissionData(
    sections: TemplateSection[],
    rawData: unknown,
): SubmissionFieldMap {
    if (!isRecord(rawData)) {
        throw new Error("Form submission must be an object");
    }

    const sizeBytes = new TextEncoder().encode(JSON.stringify(rawData)).length;
    if (sizeBytes > MAX_SUBMISSION_SIZE_BYTES) {
        throw new Error("Form submission is too large");
    }

    const allowedFields = new Map<string, TemplateField>();
    for (const section of sections) {
        if (!section.enabled) continue;
        for (const field of section.fields) {
            if (field.type === "paragraph") continue;
            allowedFields.set(field.id, field);
        }
    }

    const normalized: SubmissionFieldMap = {};

    for (const [key, value] of Object.entries(rawData)) {
        if (typeof value !== "string") {
            throw new Error(`Invalid value for field: ${key}`);
        }

        // Handle follow-up keys (e.g. "f-123__fu__fu-456")
        const parsed = parseFollowUpKey(key);
        if (parsed) {
            const parent = allowedFields.get(parsed.parentId);
            if (!parent) {
                throw new Error(`Unexpected field: ${key}`);
            }
            const fu = parent.followUps?.find(
                (f) => f.id === parsed.followUpId,
            );
            if (!fu) {
                throw new Error(`Unexpected field: ${key}`);
            }
            if (fu.type === "paragraph") {
                throw new Error(`Unexpected field: ${key}`);
            }
            normalized[key] = value;
            continue;
        }

        if (!allowedFields.has(key)) {
            throw new Error(`Unexpected field: ${key}`);
        }
        normalized[key] = value;
    }

    for (const field of allowedFields.values()) {
        const value = normalized[field.id] ?? "";

        if (field.required && value.trim().length === 0) {
            throw new Error(`${field.label} is required`);
        }

        if (
            field.type === "email" &&
            value &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
            throw new Error(`${field.label} must be a valid email address`);
        }

        if (
            (field.type === "select" || field.type === "radio") &&
            value &&
            !(field.options ?? []).includes(value)
        ) {
            throw new Error(`${field.label} has an invalid selection`);
        }

        if (field.type === "multiSelect" && value) {
            const selected = parseMultipleChoiceValue(value);
            const allowed = field.options ?? [];
            if (!selected.every((v) => allowed.includes(v))) {
                throw new Error(`${field.label} has an invalid selection`);
            }
        }

        if (field.type === "number" && value && Number.isNaN(Number(value))) {
            throw new Error(`${field.label} must be a number`);
        }

        // Custom validation rules
        const fv = field.validation;
        if (fv && value) {
            if (field.type === "number") {
                const num = Number(value);
                if (fv.min != null && num < fv.min)
                    throw new Error(
                        fv.message ??
                            `${field.label} must be at least ${fv.min}`,
                    );
                if (fv.max != null && num > fv.max)
                    throw new Error(
                        fv.message ??
                            `${field.label} must be at most ${fv.max}`,
                    );
            } else {
                if (fv.min != null && value.length < fv.min)
                    throw new Error(
                        fv.message ??
                            `${field.label} must be at least ${fv.min} characters`,
                    );
                if (fv.max != null && value.length > fv.max)
                    throw new Error(
                        fv.message ??
                            `${field.label} must be at most ${fv.max} characters`,
                    );
            }
            if (fv.pattern && !new RegExp(fv.pattern).test(value)) {
                throw new Error(
                    fv.message ?? `${field.label} has an invalid format`,
                );
            }
        }

        // Validate follow-ups: required enforcement when parent matches triggers
        if (field.followUps) {
            for (const fu of field.followUps) {
                if (fu.type === "paragraph") continue;
                if (!fu.required) continue;
                const fuKey = makeFollowUpKey(field.id, fu.id);
                const fuValue = normalized[fuKey] ?? "";
                const parentMatchesTrigger = matchesFollowUpTrigger(
                    field,
                    fu.triggers,
                    value,
                );
                if (parentMatchesTrigger && fuValue.trim().length === 0) {
                    throw new Error(`${fu.label} is required`);
                }
            }
        }
    }

    return normalized;
}

export type FollowUpField = z.infer<typeof followUpFieldSchema>;
export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type ParagraphStyle = z.infer<typeof paragraphStyleSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type FieldType = z.infer<typeof fieldTypeSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type DeliveryChannel = z.infer<typeof deliveryChannelSchema>;
export type FormLanguage = z.infer<typeof formLanguageSchema>;
