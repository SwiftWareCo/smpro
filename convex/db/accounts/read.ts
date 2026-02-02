import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function listByUser(ctx: QueryCtx, userId: string) {
    return ctx.db
        .query("connectedAccounts")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();
}

export async function listByPlatform(
    ctx: QueryCtx,
    userId: string,
    platform: string,
) {
    return ctx.db
        .query("connectedAccounts")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("platform"), platform))
        .collect();
}

export async function listByClient(
    ctx: QueryCtx,
    userId: string,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("connectedAccounts")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
}

export async function listUnlinked(ctx: QueryCtx, userId: string) {
    return ctx.db
        .query("connectedAccounts")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("clientId"), null))
        .collect();
}

export async function countByClient(
    ctx: QueryCtx,
    userId: string,
    clientId: Id<"clients">,
) {
    const accounts = await listByClient(ctx, userId, clientId);
    return accounts.length;
}

export async function countByPlatform(
    ctx: QueryCtx,
    userId: string,
    clientId: Id<"clients">,
) {
    const accounts = await listByClient(ctx, userId, clientId);

    const counts: { instagram: number; facebook: number } = {
        instagram: 0,
        facebook: 0,
    };
    for (const account of accounts) {
        if (account.platform === "instagram") counts.instagram += 1;
        if (account.platform === "facebook") counts.facebook += 1;
    }
    return counts;
}

export async function getById(
    ctx: QueryCtx,
    accountId: Id<"connectedAccounts">,
) {
    return ctx.db.get(accountId);
}
