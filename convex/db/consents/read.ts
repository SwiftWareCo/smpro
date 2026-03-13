import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function getById(ctx: QueryCtx, id: Id<"consentRecords">) {
    return ctx.db.get(id);
}

export async function getBySubmission(
    ctx: QueryCtx,
    submissionId: Id<"formSubmissions">,
) {
    return ctx.db
        .query("consentRecords")
        .withIndex("by_submission_id", (q) =>
            q.eq("submissionId", submissionId),
        )
        .unique();
}

export async function listByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    limit = 50,
) {
    return ctx.db
        .query("consentRecords")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("desc")
        .take(limit);
}
