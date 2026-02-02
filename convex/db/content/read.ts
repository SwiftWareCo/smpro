import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function listByAccountIds(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
) {
    const items: any[] = [];
    for (const accountId of accountIds) {
        const accountItems = await ctx.db
            .query("content")
            .withIndex("by_account_id", (q) => q.eq("accountId", accountId))
            .collect();
        items.push(...accountItems);
    }
    return items;
}

export async function list(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
    options: { platform?: string; limit?: number },
) {
    const items = await listByAccountIds(ctx, accountIds);
    const filtered = options.platform
        ? items.filter((item) => item.platform === options.platform)
        : items;

    filtered.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    return filtered.slice(0, options.limit ?? 50);
}

export async function stats(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
) {
    if (accountIds.length === 0) {
        return {
            totalContent: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
        };
    }

    const items = await listByAccountIds(ctx, accountIds);
    return items.reduce(
        (acc, item) => {
            acc.totalContent += 1;
            acc.totalViews += item.views ?? 0;
            acc.totalLikes += item.likes ?? 0;
            acc.totalComments += item.comments ?? 0;
            acc.totalShares += item.shares ?? 0;
            return acc;
        },
        {
            totalContent: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
        },
    );
}

export async function statsByPlatform(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
) {
    if (accountIds.length === 0) return [];

    const items = await listByAccountIds(ctx, accountIds);
    const buckets: Record<
        string,
        { totalContent: number; totalViews: number; totalEngagement: number }
    > = {};

    for (const item of items) {
        const platform = item.platform ?? "unknown";
        if (!buckets[platform]) {
            buckets[platform] = {
                totalContent: 0,
                totalViews: 0,
                totalEngagement: 0,
            };
        }
        buckets[platform].totalContent += 1;
        buckets[platform].totalViews += item.views ?? 0;
        buckets[platform].totalEngagement +=
            (item.likes ?? 0) + (item.comments ?? 0) + (item.shares ?? 0);
    }

    return Object.entries(buckets).map(([platform, stats]) => ({
        platform,
        totalContent: stats.totalContent,
        totalViews: stats.totalViews,
        avgEngagement:
            stats.totalContent > 0
                ? stats.totalEngagement / stats.totalContent
                : 0,
    }));
}

export async function top(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
    options: { limit?: number; platform?: string },
) {
    const items = await listByAccountIds(ctx, accountIds);
    const filtered = options.platform
        ? items.filter((item) => item.platform === options.platform)
        : items;

    filtered.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    return filtered.slice(0, options.limit ?? 5);
}

export async function topByMetric(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
    options: { limit?: number; platform?: string; metric: string },
) {
    const items = await listByAccountIds(ctx, accountIds);
    const filtered = options.platform
        ? items.filter((item) => item.platform === options.platform)
        : items;

    const metric = options.metric as keyof (typeof filtered)[number];
    filtered.sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0));
    return filtered.slice(0, options.limit ?? 5);
}

export async function recent(
    ctx: QueryCtx,
    accountIds: Array<Id<"connectedAccounts">>,
    limit: number,
) {
    const items = await listByAccountIds(ctx, accountIds);
    items.sort((a, b) => b.createdAt - a.createdAt);
    return items.slice(0, limit);
}
