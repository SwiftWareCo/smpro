import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function listByUser(ctx: QueryCtx, userId: string) {
    const clients = await ctx.db
        .query("clients")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

    return clients.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getById(ctx: QueryCtx, clientId: Id<"clients">) {
    return ctx.db.get(clientId);
}

export async function getSummary(ctx: QueryCtx, clientId: Id<"clients">) {
    const client = await getById(ctx, clientId);
    if (!client) return null;

    return {
        _id: client._id,
        avatarUrl: client.avatarUrl ?? null,
        description: client.description ?? null,
        enabledModules: client.enabledModules ?? null,
    };
}
