import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function listByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    limit = 50,
) {
    const logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("desc")
        .take(limit);
    return logs;
}

export async function listByResource(
    ctx: QueryCtx,
    resource: string,
    resourceId: string,
    limit = 50,
) {
    const logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_resource", (q) =>
            q.eq("resource", resource).eq("resourceId", resourceId),
        )
        .order("desc")
        .take(limit);
    return logs;
}

export async function listByActor(
    ctx: QueryCtx,
    actor: string,
    limit = 50,
) {
    const logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actor", actor))
        .order("desc")
        .take(limit);
    return logs;
}

export async function listRecent(ctx: QueryCtx, limit = 100) {
    return ctx.db
        .query("auditLogs")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
}
