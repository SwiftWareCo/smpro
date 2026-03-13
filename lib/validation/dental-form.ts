import { z } from "zod";

export const fieldTypeSchema = z.enum([
    "text",
    "textarea",
    "email",
    "phone",
    "date",
    "select",
    "radio",
    "checkbox",
    "number",
    "signature",
    "heading",
    "paragraph",
]);

export const fieldValidationSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
});

export const templateFieldSchema = z.object({
    id: z.string(),
    type: fieldTypeSchema,
    label: z.string().min(1, "Field label is required"),
    placeholder: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    validation: fieldValidationSchema.optional(),
    isPhi: z.boolean(),
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

export const MAX_SUBMISSION_SIZE_BYTES = 256 * 1024;

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
            if (field.type === "heading" || field.type === "paragraph") {
                continue;
            }
            allowedFields.set(field.id, field);
        }
    }

    const normalized: SubmissionFieldMap = {};

    for (const [fieldId, value] of Object.entries(rawData)) {
        if (!allowedFields.has(fieldId)) {
            throw new Error(`Unexpected field: ${fieldId}`);
        }
        if (typeof value !== "string") {
            throw new Error(`Invalid value for field: ${fieldId}`);
        }
        normalized[fieldId] = value;
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

        if (
            field.type === "checkbox" &&
            value &&
            value !== "true" &&
            value !== "false"
        ) {
            throw new Error(`${field.label} must be true or false`);
        }

        if (field.type === "number" && value && Number.isNaN(Number(value))) {
            throw new Error(`${field.label} must be a number`);
        }
    }

    return normalized;
}

export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type FieldType = z.infer<typeof fieldTypeSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type DeliveryChannel = z.infer<typeof deliveryChannelSchema>;
