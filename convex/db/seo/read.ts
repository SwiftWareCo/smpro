import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function getByClient(ctx: QueryCtx, clientId: Id<"clients">) {
    return ctx.db
        .query("clientSeoSettings")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .first();
}
