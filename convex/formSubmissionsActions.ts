"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { validateSubmissionData } from "../lib/validation/dental-form";

export const submit = action({
    args: {
        token: v.string(),
        formData: v.any(),
        consentGiven: v.boolean(),
        ip: v.optional(v.string()),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{
        submissionId: Id<"formSubmissions">;
        consentRecordId: Id<"consentRecords">;
    }> => {
        if (!args.consentGiven) {
            throw new ConvexError({
                code: "CONSENT_REQUIRED",
                message: "Patient consent is required to submit this form",
            });
        }

        const deliveryInfo = await ctx.runQuery(api.formTemplates.getByToken, {
            token: args.token,
        });
        if (!deliveryInfo) {
            throw new ConvexError({
                code: "INVALID_TOKEN",
                message: "This form link is invalid or has expired",
            });
        }

        const { template, delivery } = deliveryInfo;
        const baseTemplate = await ctx.runQuery(api.formTemplates.getInternal, {
            templateId: template._id,
        });
        const validationTemplate = baseTemplate ?? template;

        let validatedFormData: Record<string, string>;
        try {
            validatedFormData = validateSubmissionData(
                validationTemplate.sections,
                args.formData,
            );
        } catch (error) {
            throw new ConvexError({
                code: "INVALID_FORM_DATA",
                message:
                    error instanceof Error
                        ? error.message
                        : "Form submission is invalid",
            });
        }

        const result: {
            submissionId: Id<"formSubmissions">;
            consentRecordId: Id<"consentRecords">;
        } = await ctx.runMutation(
            internal.formSubmissions.createSubmissionWithConsent,
            {
                clientId: validationTemplate.clientId,
                templateId: validationTemplate._id,
                deliveryId: delivery._id,
                formData: validatedFormData,
                consentVersion: validationTemplate.consentVersion,
                consentTextSnapshot: validationTemplate.consentText,
                ip: args.ip,
            },
        );

        return result;
    },
});
