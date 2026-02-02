import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function getSettingsByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("autoblogSettings")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .first();
}

export async function listPostsByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("autoblogPosts")
        .withIndex("by_client", (q) => q.eq("clientId", clientId))
        .collect();
}
