import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireClientAccess } from "./_lib/auth";
import * as ConsentsRead from "./db/consents/read";
import * as DentalFormsRead from "./db/dentalForms/read";

export const getBySubmission = query({
    args: { submissionId: v.id("formSubmissions") },
    handler: async (ctx, args) => {
        const submission = await DentalFormsRead.getSubmissionById(
            ctx,
            args.submissionId,
        );
        if (!submission) {
            return null;
        }
        await requireClientAccess(ctx, submission.clientId);
        return ConsentsRead.getBySubmission(ctx, args.submissionId);
    },
});

export const listByClient = query({
    args: {
        clientId: v.id("clients"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return ConsentsRead.listByClient(ctx, args.clientId, args.limit ?? 50);
    },
});
