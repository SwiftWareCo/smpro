import { v } from "convex/values";
import { mutation } from "./_generated/server";

const CONFIRM_TOKEN = "MIGRATE_FOLLOWUPS";

type LegacyFollowUp = {
    enabled?: unknown;
    trigger?: unknown;
    label?: unknown;
    required?: unknown;
};

type FieldLike = {
    id?: unknown;
    type?: unknown;
    followUp?: LegacyFollowUp;
    followUps?: unknown;
    [key: string]: unknown;
};

type SectionLike = {
    fields?: unknown;
    [key: string]: unknown;
};

type LocalizedTemplateLike = {
    sections?: unknown;
    [key: string]: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toFollowUpId(fieldId: unknown): string {
    if (typeof fieldId === "string" && fieldId.trim().length > 0) {
        return `fu-migrated-${fieldId}`;
    }
    return `fu-migrated-${Math.random().toString(36).slice(2, 8)}`;
}

function isChoiceField(fieldType: unknown): boolean {
    return (
        fieldType === "radio" ||
        fieldType === "select" ||
        fieldType === "multiSelect"
    );
}

function migrateField(field: FieldLike): { field: FieldLike; changed: boolean } {
    if (!isObject(field)) return { field, changed: false };

    const next: FieldLike = { ...field };
    const legacy = next.followUp;
    if (!isObject(legacy)) {
        return { field: next, changed: false };
    }

    const hasNewFollowUps =
        Array.isArray(next.followUps) && next.followUps.length > 0;

    if (!hasNewFollowUps && legacy.enabled === true) {
        const trigger =
            typeof legacy.trigger === "string" && legacy.trigger.trim().length > 0
                ? legacy.trigger
                : isChoiceField(next.type)
                  ? "__any__"
                  : "__any__";
        const label =
            typeof legacy.label === "string" && legacy.label.trim().length > 0
                ? legacy.label
                : "Please provide details";

        next.followUps = [
            {
                id: toFollowUpId(next.id),
                type: "textarea",
                label,
                required: legacy.required === true,
                triggers: [trigger],
            },
        ];
    }

    delete next.followUp;
    return { field: next, changed: true };
}

function migrateSections(
    sections: unknown,
): { sections: unknown; changedFields: number } {
    if (!Array.isArray(sections)) {
        return { sections, changedFields: 0 };
    }

    let changedFields = 0;
    const nextSections = sections.map((section) => {
        if (!isObject(section)) return section;
        const sectionLike = section as SectionLike;

        if (!Array.isArray(sectionLike.fields)) return section;

        const nextFields = sectionLike.fields.map((field) => {
            if (!isObject(field)) return field;
            const migrated = migrateField(field as FieldLike);
            if (migrated.changed) changedFields += 1;
            return migrated.field;
        });

        return {
            ...sectionLike,
            fields: nextFields,
        };
    });

    return { sections: nextSections, changedFields };
}

function migrateLocalizedTemplate(
    localized: unknown,
): { localized: unknown; changedFields: number } {
    if (!isObject(localized)) {
        return { localized, changedFields: 0 };
    }

    const templateLike = localized as LocalizedTemplateLike;
    const migratedSections = migrateSections(templateLike.sections);
    if (migratedSections.changedFields === 0) {
        return { localized, changedFields: 0 };
    }

    return {
        localized: {
            ...templateLike,
            sections: migratedSections.sections,
        },
        changedFields: migratedSections.changedFields,
    };
}

export const migrateFollowUpToFollowUps = mutation({
    args: {
        dryRun: v.optional(v.boolean()),
        limit: v.optional(v.number()),
        confirm: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const dryRun = args.dryRun ?? true;
        const limit = Math.max(1, Math.min(args.limit ?? 1000, 10000));

        if (!dryRun && args.confirm !== CONFIRM_TOKEN) {
            throw new Error(
                `Set confirm to ${CONFIRM_TOKEN} to run non-dry migration`,
            );
        }

        const now = Date.now();

        const templates = await ctx.db.query("formTemplates").take(limit);
        let templatesScanned = 0;
        let templatesChanged = 0;
        let templateFieldsChanged = 0;

        for (const template of templates) {
            templatesScanned += 1;

            const migratedSections = migrateSections(template.sections);

            let translationsChangedFields = 0;
            let nextTranslations = template.translations;
            if (Array.isArray(template.translations)) {
                nextTranslations = template.translations.map((tr) => {
                    const migrated = migrateLocalizedTemplate(tr);
                    translationsChangedFields += migrated.changedFields;
                    return migrated.localized as typeof tr;
                });
            }

            const changed =
                migratedSections.changedFields > 0 || translationsChangedFields > 0;
            if (!changed) continue;

            templatesChanged += 1;
            templateFieldsChanged +=
                migratedSections.changedFields + translationsChangedFields;

            if (!dryRun) {
                await ctx.db.patch(template._id, {
                    sections: migratedSections.sections as typeof template.sections,
                    translations: nextTranslations,
                    updatedAt: now,
                });
            }
        }

        const deliveries = await ctx.db.query("formDeliveries").take(limit);
        let deliveriesScanned = 0;
        let deliveriesChanged = 0;
        let deliveryFieldsChanged = 0;

        for (const delivery of deliveries) {
            deliveriesScanned += 1;

            let changedFields = 0;

            let nextLocalizedTemplate = delivery.localizedTemplate;
            if (delivery.localizedTemplate) {
                const migrated = migrateLocalizedTemplate(delivery.localizedTemplate);
                changedFields += migrated.changedFields;
                nextLocalizedTemplate =
                    migrated.localized as typeof delivery.localizedTemplate;
            }

            let nextLocalizedTemplates = delivery.localizedTemplates;
            if (Array.isArray(delivery.localizedTemplates)) {
                nextLocalizedTemplates = delivery.localizedTemplates.map((lt) => {
                    const migrated = migrateLocalizedTemplate(lt);
                    changedFields += migrated.changedFields;
                    return migrated.localized as typeof lt;
                });
            }

            if (changedFields === 0) continue;

            deliveriesChanged += 1;
            deliveryFieldsChanged += changedFields;

            if (!dryRun) {
                await ctx.db.patch(delivery._id, {
                    localizedTemplate: nextLocalizedTemplate,
                    localizedTemplates: nextLocalizedTemplates,
                    updatedAt: now,
                });
            }
        }

        return {
            dryRun,
            confirmToken: CONFIRM_TOKEN,
            limit,
            templates: {
                scanned: templatesScanned,
                changed: templatesChanged,
                fieldsChanged: templateFieldsChanged,
            },
            deliveries: {
                scanned: deliveriesScanned,
                changed: deliveriesChanged,
                fieldsChanged: deliveryFieldsChanged,
            },
        };
    },
});
