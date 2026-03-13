import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireClientAccess } from "./_lib/auth";
import { logAuditEvent } from "./_lib/audit";
import * as DentalFormsRead from "./db/dentalForms/read";
import * as DentalFormsWrite from "./db/dentalForms/write";
import * as ConsentsWrite from "./db/consents/write";

export const list = query({
    args: {
        clientId: v.id("clients"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);

        if (args.status) {
            return DentalFormsRead.listSubmissionsByClientAndStatus(
                ctx,
                args.clientId,
                args.status,
                args.limit ?? 50,
            );
        }
        return DentalFormsRead.listSubmissionsByClient(
            ctx,
            args.clientId,
            args.limit ?? 50,
        );
    },
});

export const get = query({
    args: { submissionId: v.id("formSubmissions") },
    handler: async (ctx, args) => {
        const submission = await DentalFormsRead.getSubmissionById(
            ctx,
            args.submissionId,
        );
        if (!submission) return null;
        await requireClientAccess(ctx, submission.clientId);
        return submission;
    },
});

export const createSubmissionWithConsent = internalMutation({
    args: {
        clientId: v.id("clients"),
        templateId: v.id("formTemplates"),
        deliveryId: v.id("formDeliveries"),
        formData: v.any(),
        consentVersion: v.string(),
        consentTextSnapshot: v.string(),
        ip: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const delivery = await DentalFormsRead.getDeliveryById(
            ctx,
            args.deliveryId,
        );
        if (!delivery) {
            throw new ConvexError({
                code: "INVALID_TOKEN",
                message: "This form link is invalid or has expired",
            });
        }
        if (
            delivery.clientId !== args.clientId ||
            delivery.templateId !== args.templateId
        ) {
            throw new ConvexError({
                code: "INVALID_TOKEN",
                message: "This form link is invalid or has expired",
            });
        }

        const now = Date.now();
        if (delivery.tokenExpiresAt < now || delivery.status === "expired") {
            throw new ConvexError({
                code: "INVALID_TOKEN",
                message: "This form link is invalid or has expired",
            });
        }
        if (delivery.status === "completed") {
            throw new ConvexError({
                code: "ALREADY_SUBMITTED",
                message: "This form has already been submitted",
            });
        }
        if (delivery.status === "failed") {
            throw new ConvexError({
                code: "INVALID_TOKEN",
                message: "This form link is no longer valid",
            });
        }

        const template = await DentalFormsRead.getTemplateById(
            ctx,
            args.templateId,
        );
        if (
            !template ||
            template.clientId !== args.clientId ||
            template.status !== "active"
        ) {
            throw new ConvexError({
                code: "INVALID_TOKEN",
                message: "This form link is invalid or has expired",
            });
        }

        const consentRecordId = await ConsentsWrite.create(ctx, {
            clientId: args.clientId,
            consentVersion: args.consentVersion,
            consentTextSnapshot: args.consentTextSnapshot,
            purposes: [
                "dental_treatment",
                "patient_records",
                "cross_border_processing",
            ],
            givenByIp: args.ip,
        });

        const submissionId = await DentalFormsWrite.createSubmission(ctx, {
            clientId: args.clientId,
            templateId: args.templateId,
            deliveryId: args.deliveryId,
            consentRecordId,
            formData: args.formData,
        });

        // Link consent to submission
        await ctx.db.patch(consentRecordId, { submissionId });

        // Mark delivery as completed
        await DentalFormsWrite.patchDelivery(ctx, args.deliveryId, {
            status: "completed",
            completedAt: Date.now(),
        });

        await logAuditEvent(ctx, {
            actor: "patient",
            actorType: "patient",
            action: "form_submission.create",
            resource: "formSubmissions",
            resourceId: submissionId,
            clientId: args.clientId,
            ip: args.ip,
        });

        return { submissionId, consentRecordId };
    },
});
