import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function upsert(
    ctx: MutationCtx,
    data: {
        userId: string;
        clientId?: Id<"clients"> | null;
        platform: string;
        accessToken: string;
        platformUserId?: string | null;
        platformUsername?: string | null;
        clientBusinessId?: string | null;
        tokenExpiresAt?: number | null;
    },
) {
    const existing = await ctx.db
        .query("connectedAccounts")
        .withIndex("by_platform_user", (q) =>
            q
                .eq("userId", data.userId)
                .eq("platform", data.platform)
                .eq("platformUserId", data.platformUserId ?? null),
        )
        .first();

    const now = Date.now();

    if (existing) {
        await ctx.db.patch(existing._id, {
            clientId: data.clientId ?? null,
            accessToken: data.accessToken,
            platformUsername: data.platformUsername ?? null,
            clientBusinessId: data.clientBusinessId ?? null,
            tokenExpiresAt: data.tokenExpiresAt ?? null,
            updatedAt: now,
        });
        return existing;
    }

    const accountId = await ctx.db.insert("connectedAccounts", {
        userId: data.userId,
        clientId: data.clientId ?? null,
        platform: data.platform,
        accessToken: data.accessToken,
        refreshToken: null,
        platformUserId: data.platformUserId ?? null,
        platformUsername: data.platformUsername ?? null,
        clientBusinessId: data.clientBusinessId ?? null,
        tokenExpiresAt: data.tokenExpiresAt ?? null,
        createdAt: now,
        updatedAt: now,
    });
    return ctx.db.get(accountId);
}

export async function removeById(
    ctx: MutationCtx,
    accountId: Id<"connectedAccounts">,
) {
    const account = await ctx.db.get(accountId);

    if (!account) return null;

    await ctx.db.delete(account._id);
    return account;
}
