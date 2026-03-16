import { z } from "zod";
import { FORM_LANGUAGES } from "@/lib/patient-form-i18n";
import { parseMultipleChoiceValue } from "@/lib/multiple-choice";

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
]);

export const fieldValidationSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
});

export const followUpSchema = z.object({
    enabled: z.boolean(),
    trigger: z.string(),
    label: z.string(),
    required: z.boolean(),
});

export const templateFieldSchema = z.object({
    id: z.string(),
    type: fieldTypeSchema,
    label: z.string().min(1, "Field label is required"),
    placeholder: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    validation: fieldValidationSchema.optional(),
    followUp: followUpSchema.optional(),
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
export const FOLLOW_UP_SUFFIX = "__followUp";

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
            allowedFields.set(field.id, field);
        }
    }

    const normalized: SubmissionFieldMap = {};

    for (const [key, value] of Object.entries(rawData)) {
        if (typeof value !== "string") {
            throw new Error(`Invalid value for field: ${key}`);
        }

        // Handle follow-up keys (e.g. "f-123__followUp")
        if (key.endsWith(FOLLOW_UP_SUFFIX)) {
            const parentId = key.slice(0, -FOLLOW_UP_SUFFIX.length);
            if (!allowedFields.has(parentId)) {
                throw new Error(`Unexpected field: ${key}`);
            }
            const parent = allowedFields.get(parentId)!;
            if (!parent.followUp?.enabled) {
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
                    fv.message ??
                        `${field.label} has an invalid format`,
                );
            }
        }

        // Validate follow-up required when parent matches trigger
        if (field.followUp?.enabled && field.followUp.required) {
            const followUpKey = `${field.id}${FOLLOW_UP_SUFFIX}`;
            const followUpValue = normalized[followUpKey] ?? "";
            const parentMatchesTrigger = value === field.followUp.trigger;

            if (parentMatchesTrigger && followUpValue.trim().length === 0) {
                throw new Error(`${field.followUp.label} is required`);
            }
        }
    }

    return normalized;
}

export type FollowUp = z.infer<typeof followUpSchema>;
export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type FieldType = z.infer<typeof fieldTypeSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type DeliveryChannel = z.infer<typeof deliveryChannelSchema>;
export type FormLanguage = z.infer<typeof formLanguageSchema>;
