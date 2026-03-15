import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

// --- Form Templates ---

interface TemplateSection {
    id: string;
    title: string;
    description?: string;
    enabled: boolean;
    fields: TemplateField[];
}

interface TemplateField {
    id: string;
    type:
        | "text"
        | "textarea"
        | "email"
        | "phone"
        | "date"
        | "select"
        | "radio"
        | "checkbox"
        | "number"
        | "signature"
        | "address";
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

interface LocalizedTemplateSnapshot {
    language: "en" | "es" | "ar" | "zh-Hans" | "zh-Hant";
    name: string;
    description?: string;
    sections: TemplateSection[];
    consentText: string;
    consentVersion: string;
}

export async function createTemplate(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        name: string;
        description?: string;
        sections: TemplateSection[];
        consentText: string;
        consentVersion: string;
        createdBy: string;
    },
) {
    const now = Date.now();
    return ctx.db.insert("formTemplates", {
        clientId: data.clientId,
        name: data.name,
        description: data.description,
        version: 1,
        status: "draft",
        sections: data.sections,
        consentText: data.consentText,
        consentVersion: data.consentVersion,
        translations: [],
        translationStatus: "pending",
        translationError: null,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
    });
}

export async function patchTemplate(
    ctx: MutationCtx,
    templateId: Id<"formTemplates">,
    patch: Record<string, unknown>,
) {
    const template = await ctx.db.get(templateId);
    if (!template) return null;
    await ctx.db.patch(templateId, { ...patch, updatedAt: Date.now() });
    return template;
}

export async function deleteTemplate(
    ctx: MutationCtx,
    templateId: Id<"formTemplates">,
) {
    const template = await ctx.db.get(templateId);
    if (!template) return null;
    await ctx.db.delete(templateId);
    return template;
}

// --- Form Submissions ---

export async function createSubmission(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        templateId: Id<"formTemplates">;
        deliveryId?: Id<"formDeliveries">;
        consentRecordId?: Id<"consentRecords">;
        formData: Record<string, unknown>;
    },
) {
    const now = Date.now();
    return ctx.db.insert("formSubmissions", {
        clientId: data.clientId,
        templateId: data.templateId,
        deliveryId: data.deliveryId,
        consentRecordId: data.consentRecordId,
        formData: data.formData,
        submittedAt: now,
        status: "submitted",
        createdAt: now,
        updatedAt: now,
    });
}

// --- Form Deliveries ---

export async function createDelivery(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        templateId: Id<"formTemplates">;
        patientName?: string;
        channel: "email" | "sms" | "qr" | "link" | "tablet";
        token: string;
        tokenExpiresAt: number;
        preferredLanguage?: "en" | "es" | "ar" | "zh-Hans" | "zh-Hant";
        localizedTemplate?: LocalizedTemplateSnapshot;
        localizedTemplates?: LocalizedTemplateSnapshot[];
        createdBy: string;
    },
) {
    const now = Date.now();
    return ctx.db.insert("formDeliveries", {
        clientId: data.clientId,
        templateId: data.templateId,
        patientName: data.patientName,
        channel: data.channel,
        token: data.token,
        tokenExpiresAt: data.tokenExpiresAt,
        preferredLanguage: data.preferredLanguage,
        localizedTemplate: data.localizedTemplate,
        localizedTemplates: data.localizedTemplates,
        status: "pending",
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
    });
}

export async function patchDelivery(
    ctx: MutationCtx,
    deliveryId: Id<"formDeliveries">,
    patch: Record<string, unknown>,
) {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery) return null;
    await ctx.db.patch(deliveryId, { ...patch, updatedAt: Date.now() });
    return delivery;
}
