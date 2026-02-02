import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function upsertFromImport(
    ctx: MutationCtx,
    args: {
        accountId: Id<"connectedAccounts">;
        platform: string;
        platformVideoId: string;
        mediaType?: string | null;
        title?: string | null;
        description?: string | null;
        caption?: string | null;
        thumbnailUrl?: string | null;
        mediaUrl?: string | null;
        views?: number | null;
        likes?: number | null;
        comments?: number | null;
        shares?: number | null;
        duration?: number | null;
        publishedAt?: number | null;
        rawData?: unknown;
    },
) {
    const now = Date.now();
    const existing = await ctx.db
        .query("content")
        .withIndex("by_platform_video", (q) =>
            q.eq("platformVideoId", args.platformVideoId),
        )
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            views: args.views ?? existing.views,
            likes: args.likes ?? existing.likes,
            comments: args.comments ?? existing.comments,
            shares: args.shares ?? existing.shares,
            updatedAt: now,
        });
        return { doc: existing, inserted: false };
    }

    const contentId = await ctx.db.insert("content", {
        accountId: args.accountId,
        platform: args.platform,
        platformVideoId: args.platformVideoId,
        mediaType: args.mediaType ?? null,
        title: args.title ?? null,
        description: args.description ?? null,
        caption: args.caption ?? null,
        thumbnailUrl: args.thumbnailUrl ?? null,
        mediaUrl: args.mediaUrl ?? null,
        views: args.views ?? 0,
        likes: args.likes ?? 0,
        comments: args.comments ?? 0,
        shares: args.shares ?? 0,
        duration: args.duration ?? null,
        publishedAt: args.publishedAt ?? null,
        rawData: args.rawData ?? null,
        createdAt: now,
        updatedAt: now,
    });
    const doc = await ctx.db.get(contentId);
    return { doc, inserted: true };
}

export async function deleteByAccountId(
    ctx: MutationCtx,
    accountId: Id<"connectedAccounts">,
) {
    const items = await ctx.db
        .query("content")
        .withIndex("by_account_id", (q) => q.eq("accountId", accountId))
        .collect();
    for (const item of items) {
        await ctx.db.delete(item._id);
    }
    return { success: true };
}
