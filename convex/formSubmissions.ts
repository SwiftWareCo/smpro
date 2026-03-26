import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireClientAccess } from "./_lib/auth";
import { logAuditEvent } from "./_lib/audit";
import * as DentalFormsRead from "./db/dentalForms/read";
import * as DentalFormsWrite from "./db/dentalForms/write";
import * as ConsentsWrite from "./db/consents/write";

function getSubmittedByName(
    submission: Doc<"formSubmissions">,
    delivery: Doc<"formDeliveries"> | null,
): string {
    const explicitPatientName = delivery?.patientName?.trim();
    if (explicitPatientName) {
        return explicitPatientName;
    }

    const formData = submission.formData as Record<string, unknown> | undefined;
    if (!formData) return "Unknown patient";

    const firstName = String(formData["first-name"] ?? "").trim();
    const lastName = String(formData["last-name"] ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Unknown patient";
}

export const list = query({
    args: {
        clientId: v.id("clients"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);

        const submissions = args.status
            ? await DentalFormsRead.listSubmissionsByClientAndStatus(
                  ctx,
                  args.clientId,
                  args.status,
                  args.limit ?? 50,
              )
            : await DentalFormsRead.listSubmissionsByClient(
                  ctx,
                  args.clientId,
                  args.limit ?? 50,
              );

        return Promise.all(
            submissions.map(async (submission) => {
                const [template, delivery] = await Promise.all([
                    ctx.db.get(submission.templateId),
                    submission.deliveryId
                        ? ctx.db.get(submission.deliveryId)
                        : Promise.resolve(null),
                ]);

                return {
                    ...submission,
                    submittedByName: getSubmittedByName(submission, delivery),
                    templateName: template?.name ?? "Unknown form",
                    templateVersion: template?.version ?? null,
                };
            }),
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

export const remove = mutation({
    args: { submissionId: v.id("formSubmissions") },
    handler: async (ctx, args) => {
        const submission = await DentalFormsRead.getSubmissionById(
            ctx,
            args.submissionId,
        );
        if (!submission) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Submission not found",
            });
        }

        const client = await requireClientAccess(ctx, submission.clientId);

        if (submission.consentRecordId) {
            const consent = await ctx.db.get(submission.consentRecordId);
            if (consent) {
                await ctx.db.delete(consent._id);
            }
        }

        await ctx.db.delete(submission._id);

        await logAuditEvent(ctx, {
            actor: client.userId,
            actorType: "user",
            action: "form_submission.delete",
            resource: "formSubmissions",
            resourceId: submission._id,
            clientId: submission.clientId,
        });

        return { success: true };
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
