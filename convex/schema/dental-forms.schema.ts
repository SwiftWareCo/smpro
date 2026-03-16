import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Form template field definition (stored as JSON in sections).
 * Each section contains an array of fields with type, label, validation rules, etc.
 */
const fieldSchema = v.object({
    id: v.string(),
    type: v.union(
        v.literal("text"),
        v.literal("textarea"),
        v.literal("email"),
        v.literal("phone"),
        v.literal("date"),
        v.literal("select"),
        v.literal("radio"),
        v.literal("multiSelect"),
        v.literal("number"),
        v.literal("signature"),
        v.literal("address"),
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
    followUp: v.optional(
        v.object({
            enabled: v.boolean(),
            trigger: v.string(),
            label: v.string(),
            required: v.boolean(),
        }),
    ),
});

const sectionSchema = v.object({
    id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    fields: v.array(fieldSchema),
});

const localizedTemplateSchema = v.object({
    language: v.union(
        v.literal("en"),
        v.literal("es"),
        v.literal("ar"),
        v.literal("zh-Hans"),
        v.literal("zh-Hant"),
    ),
    name: v.string(),
    description: v.optional(v.string()),
    sections: v.array(sectionSchema),
    consentText: v.string(),
    consentVersion: v.string(),
});

export const formTemplates = defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    description: v.optional(v.string()),
    version: v.number(),
    status: v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("archived"),
    ),
    sections: v.array(sectionSchema),
    consentText: v.string(),
    consentVersion: v.string(),
    translations: v.optional(v.array(localizedTemplateSchema)),
    translatedAt: v.optional(v.number()),
    translationStatus: v.optional(
        v.union(
            v.literal("pending"),
            v.literal("completed"),
            v.literal("failed"),
        ),
    ),
    translationError: v.optional(v.union(v.string(), v.null())),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client_id", ["clientId"])
    .index("by_client_status", ["clientId", "status"]);

export const formSubmissions = defineTable({
    clientId: v.id("clients"),
    templateId: v.id("formTemplates"),
    deliveryId: v.optional(v.id("formDeliveries")),
    consentRecordId: v.optional(v.id("consentRecords")),
    formData: v.any(),
    submittedAt: v.number(),
    status: v.union(
        v.literal("submitted"),
        v.literal("under_review"),
        v.literal("approved"),
        v.literal("exported"),
        v.literal("entered_in_pms"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client_id", ["clientId"])
    .index("by_client_status", ["clientId", "status"]);

export const formDeliveries = defineTable({
    clientId: v.id("clients"),
    templateId: v.id("formTemplates"),
    patientName: v.optional(v.string()),
    channel: v.union(
        v.literal("email"),
        v.literal("sms"),
        v.literal("qr"),
        v.literal("link"),
        v.literal("tablet"),
    ),
    token: v.string(),
    tokenExpiresAt: v.number(),
    preferredLanguage: v.optional(
        v.union(
            v.literal("en"),
            v.literal("es"),
            v.literal("ar"),
            v.literal("zh-Hans"),
            v.literal("zh-Hant"),
        ),
    ),
    localizedTemplate: v.optional(localizedTemplateSchema),
    localizedTemplates: v.optional(v.array(localizedTemplateSchema)),
    status: v.union(
        v.literal("pending"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("opened"),
        v.literal("completed"),
        v.literal("expired"),
        v.literal("failed"),
    ),
    completedAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_token", ["token"])
    .index("by_client_template", ["clientId", "templateId"]);
