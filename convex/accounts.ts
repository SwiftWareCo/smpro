import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./_lib/auth";
import * as AccountsRead from "./db/accounts/read";
import * as AccountsWrite from "./db/accounts/write";
import * as ContentWrite from "./db/content/write";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        return AccountsRead.listByUser(ctx, userId);
    },
});

export const listByPlatform = query({
    args: { platform: v.string() },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        return AccountsRead.listByPlatform(ctx, userId, args.platform);
    },
});

export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        return AccountsRead.listByClient(ctx, userId, args.clientId);
    },
});

export const listUnlinked = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        return AccountsRead.listUnlinked(ctx, userId);
    },
});

export const countByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        return AccountsRead.countByClient(ctx, userId, args.clientId);
    },
});

export const countByPlatform = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        return AccountsRead.countByPlatform(ctx, userId, args.clientId);
    },
});

export const upsert = mutation({
    args: {
        userId: v.string(),
        clientId: v.optional(v.union(v.id("clients"), v.null())),
        platform: v.string(),
        accessToken: v.string(),
        platformUserId: v.optional(v.union(v.string(), v.null())),
        platformUsername: v.optional(v.union(v.string(), v.null())),
        clientBusinessId: v.optional(v.union(v.string(), v.null())),
        tokenExpiresAt: v.optional(v.union(v.number(), v.null())),
    },
    handler: async (ctx, args) => {
        const authUserId = await requireUserId(ctx);
        if (authUserId !== args.userId) {
            throw new Error("Unauthorized");
        }
        return AccountsWrite.upsert(ctx, {
            userId: args.userId,
            clientId: args.clientId ?? null,
            platform: args.platform,
            accessToken: args.accessToken,
            platformUserId: args.platformUserId ?? null,
            platformUsername: args.platformUsername ?? null,
            clientBusinessId: args.clientBusinessId ?? null,
            tokenExpiresAt: args.tokenExpiresAt ?? null,
        });
    },
});

export const remove = mutation({
    args: { accountId: v.id("connectedAccounts") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const account = await AccountsRead.getById(ctx, args.accountId);

        if (!account || account.userId !== userId) {
            throw new Error("Account not found");
        }

        await ContentWrite.deleteByAccountId(ctx, args.accountId);
        await AccountsWrite.removeById(ctx, args.accountId);
        return { success: true };
    },
});
