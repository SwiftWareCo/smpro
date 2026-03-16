import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireClientAccess } from "./_lib/auth";
import { logAuditEvent } from "./_lib/audit";
import * as DentalFormsRead from "./db/dentalForms/read";
import * as DentalFormsWrite from "./db/dentalForms/write";
import * as ClientsRead from "./db/clients/read";

const fieldValidator = v.object({
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

const sectionValidator = v.object({
    id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    fields: v.array(fieldValidator),
});

export const list = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return DentalFormsRead.listTemplatesByClient(ctx, args.clientId);
    },
});

export const get = query({
    args: { templateId: v.id("formTemplates") },
    handler: async (ctx, args) => {
        const template = await DentalFormsRead.getTemplateById(
            ctx,
            args.templateId,
        );
        if (!template) return null;
        await requireClientAccess(ctx, template.clientId);
        return template;
    },
});

export const getInternal = query({
    args: { templateId: v.id("formTemplates") },
    handler: async (ctx, args) => {
        return DentalFormsRead.getTemplateById(ctx, args.templateId);
    },
});

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const delivery = await DentalFormsRead.getDeliveryByToken(
            ctx,
            args.token,
        );
        if (!delivery) return null;
        if (delivery.tokenExpiresAt < Date.now()) return null;
        if (
            delivery.status === "completed" ||
            delivery.status === "expired" ||
            delivery.status === "failed"
        ) {
            return null;
        }

        const template = await DentalFormsRead.getTemplateById(
            ctx,
            delivery.templateId,
        );
        if (!template || template.status !== "active") return null;

        const client = await ClientsRead.getById(ctx, template.clientId);

        // When preferredLanguage is not set, the patient picks their language
        if (!delivery.preferredLanguage) {
            const storedTranslations = delivery.localizedTemplates ?? [];
            const availableLanguages: string[] = [
                "en",
                ...storedTranslations.map((t) => t.language),
            ];

            return {
                template,
                delivery: {
                    _id: delivery._id,
                    channel: delivery.channel,
                    preferredLanguage: delivery.preferredLanguage,
                },
                preferredLanguage: undefined,
                availableLanguages,
                localizedTemplates: storedTranslations,
                clientName: client?.name ?? "Clinic",
            };
        }

        // Single pre-selected language
        const localizedTemplate = delivery.localizedTemplate;
        const resolvedTemplate = localizedTemplate
            ? {
                  ...template,
                  name: localizedTemplate.name,
                  description: localizedTemplate.description,
                  sections: localizedTemplate.sections,
                  consentText: localizedTemplate.consentText,
                  consentVersion: localizedTemplate.consentVersion,
              }
            : template;

        return {
            template: resolvedTemplate,
            delivery: {
                _id: delivery._id,
                channel: delivery.channel,
                preferredLanguage: delivery.preferredLanguage,
            },
            preferredLanguage: delivery.preferredLanguage,
            clientName: client?.name ?? "Clinic",
        };
    },
});

export const create = mutation({
    args: {
        clientId: v.id("clients"),
        name: v.string(),
        description: v.optional(v.string()),
        sections: v.array(sectionValidator),
        consentText: v.string(),
        consentVersion: v.string(),
    },
    handler: async (ctx, args) => {
        const client = await requireClientAccess(ctx, args.clientId);

        const templateId = await DentalFormsWrite.createTemplate(ctx, {
            clientId: args.clientId,
            name: args.name,
            description: args.description,
            sections: args.sections,
            consentText: args.consentText,
            consentVersion: args.consentVersion,
            createdBy: client.userId,
        });

        await logAuditEvent(ctx, {
            actor: client.userId,
            actorType: "user",
            action: "form_template.create",
            resource: "formTemplates",
            resourceId: templateId,
            clientId: args.clientId,
        });

        // Schedule non-blocking translation
        await ctx.scheduler.runAfter(
            0,
            internal.formTemplateActions.translateTemplate,
            { templateId },
        );

        return templateId;
    },
});

export const update = mutation({
    args: {
        templateId: v.id("formTemplates"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        sections: v.optional(v.array(sectionValidator)),
        consentText: v.optional(v.string()),
        consentVersion: v.optional(v.string()),
        status: v.optional(
            v.union(
                v.literal("draft"),
                v.literal("active"),
                v.literal("archived"),
            ),
        ),
    },
    handler: async (ctx, args) => {
        const template = await DentalFormsRead.getTemplateById(
            ctx,
            args.templateId,
        );
        if (!template) throw new Error("Template not found");

        const client = await requireClientAccess(ctx, template.clientId);

        const patch: Record<string, unknown> = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.description !== undefined)
            patch.description = args.description;
        if (args.sections !== undefined) {
            patch.sections = args.sections;
            patch.version = template.version + 1;
        }
        if (args.consentText !== undefined)
            patch.consentText = args.consentText;
        if (args.consentVersion !== undefined)
            patch.consentVersion = args.consentVersion;
        if (args.status !== undefined) patch.status = args.status;

        await DentalFormsWrite.patchTemplate(ctx, args.templateId, patch);

        await logAuditEvent(ctx, {
            actor: client.userId,
            actorType: "user",
            action: "form_template.update",
            resource: "formTemplates",
            resourceId: args.templateId,
            clientId: template.clientId,
            metadata: { fields: Object.keys(patch) },
        });

        // Re-translate if content changed (not just status)
        const contentChanged =
            args.name !== undefined ||
            args.description !== undefined ||
            args.sections !== undefined;
        if (contentChanged) {
            await DentalFormsWrite.patchTemplate(ctx, args.templateId, {
                translations: [],
                translationStatus: "pending",
                translationError: null,
            });
            await ctx.scheduler.runAfter(
                0,
                internal.formTemplateActions.translateTemplate,
                { templateId: args.templateId },
            );
        }

        return { success: true };
    },
});

export const remove = mutation({
    args: { templateId: v.id("formTemplates") },
    handler: async (ctx, args) => {
        const template = await DentalFormsRead.getTemplateById(
            ctx,
            args.templateId,
        );
        if (!template) throw new Error("Template not found");

        const client = await requireClientAccess(ctx, template.clientId);

        await DentalFormsWrite.deleteTemplate(ctx, args.templateId);

        await logAuditEvent(ctx, {
            actor: client.userId,
            actorType: "user",
            action: "form_template.delete",
            resource: "formTemplates",
            resourceId: args.templateId,
            clientId: template.clientId,
        });

        return { success: true };
    },
});

export const retranslate = mutation({
    args: { templateId: v.id("formTemplates") },
    handler: async (ctx, args) => {
        const template = await DentalFormsRead.getTemplateById(
            ctx,
            args.templateId,
        );
        if (!template) throw new Error("Template not found");
        await requireClientAccess(ctx, template.clientId);
        await DentalFormsWrite.patchTemplate(ctx, args.templateId, {
            translations: [],
            translationStatus: "pending",
            translationError: null,
        });
        await ctx.scheduler.runAfter(
            0,
            internal.formTemplateActions.translateTemplate,
            { templateId: args.templateId },
        );
    },
});

export const patchTranslations = internalMutation({
    args: {
        templateId: v.id("formTemplates"),
        translations: v.array(v.any()),
        translatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        await DentalFormsWrite.patchTemplate(ctx, args.templateId, {
            translations: args.translations,
            translatedAt: args.translatedAt,
            translationStatus: "completed",
            translationError: null,
        });
    },
});

export const setTranslationFailed = internalMutation({
    args: {
        templateId: v.id("formTemplates"),
        translationError: v.string(),
    },
    handler: async (ctx, args) => {
        await DentalFormsWrite.patchTemplate(ctx, args.templateId, {
            translationStatus: "failed",
            translationError: args.translationError,
        });
    },
});
