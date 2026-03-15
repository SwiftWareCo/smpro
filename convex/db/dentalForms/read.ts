import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

// --- Form Templates ---

export async function getTemplateById(
    ctx: QueryCtx,
    templateId: Id<"formTemplates">,
) {
    return ctx.db.get(templateId);
}

export async function listTemplatesByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("formTemplates")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("desc")
        .collect();
}

// --- Form Submissions ---

export async function getSubmissionById(
    ctx: QueryCtx,
    submissionId: Id<"formSubmissions">,
) {
    return ctx.db.get(submissionId);
}

export async function listSubmissionsByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    limit = 50,
) {
    return ctx.db
        .query("formSubmissions")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("desc")
        .take(limit);
}

export async function listSubmissionsByClientAndStatus(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    status: string,
    limit = 50,
) {
    return ctx.db
        .query("formSubmissions")
        .withIndex("by_client_status", (q) =>
            q.eq("clientId", clientId).eq("status", status as never),
        )
        .order("desc")
        .take(limit);
}

// --- Form Deliveries ---

export async function getDeliveryById(
    ctx: QueryCtx,
    deliveryId: Id<"formDeliveries">,
) {
    return ctx.db.get(deliveryId);
}

export async function getDeliveryByToken(ctx: QueryCtx, token: string) {
    return ctx.db
        .query("formDeliveries")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
}

export async function listDeliveriesByClientTemplate(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    templateId: Id<"formTemplates">,
    limit = 20,
) {
    return ctx.db
        .query("formDeliveries")
        .withIndex("by_client_template", (q) =>
            q.eq("clientId", clientId).eq("templateId", templateId),
        )
        .order("desc")
        .take(limit);
}

export async function getLatestActiveDeliveryForTemplate(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    templateId: Id<"formTemplates">,
) {
    const candidates = await ctx.db
        .query("formDeliveries")
        .withIndex("by_client_template", (q) =>
            q.eq("clientId", clientId).eq("templateId", templateId),
        )
        .order("desc")
        .take(10);

    const now = Date.now();
    return (
        candidates.find(
            (d) =>
                d.tokenExpiresAt > now &&
                d.status !== "completed" &&
                d.status !== "expired" &&
                d.status !== "failed",
        ) ?? null
    );
}
