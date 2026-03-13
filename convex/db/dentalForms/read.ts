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

export async function listActiveTemplatesByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("formTemplates")
        .withIndex("by_client_status", (q) =>
            q.eq("clientId", clientId).eq("status", "active"),
        )
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

export async function getSubmissionByDelivery(
    ctx: QueryCtx,
    deliveryId: Id<"formDeliveries">,
) {
    return ctx.db
        .query("formSubmissions")
        .withIndex("by_delivery_id", (q) => q.eq("deliveryId", deliveryId))
        .unique();
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

export async function listDeliveriesByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    limit = 50,
) {
    return ctx.db
        .query("formDeliveries")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("desc")
        .take(limit);
}

export async function listDeliveriesByTemplate(
    ctx: QueryCtx,
    templateId: Id<"formTemplates">,
    limit = 50,
) {
    return ctx.db
        .query("formDeliveries")
        .withIndex("by_template_id", (q) => q.eq("templateId", templateId))
        .order("desc")
        .take(limit);
}
