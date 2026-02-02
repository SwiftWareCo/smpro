import { embedMany } from "ai";
import { nanoid } from "nanoid";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api as generatedApi } from "./_generated/api";
import { requireUserId } from "./_lib/auth";
import * as AccountsRead from "./db/accounts/read";
import * as ContentRead from "./db/content/read";
import * as ContentWrite from "./db/content/write";
import type { Id } from "./_generated/dataModel";

const api = generatedApi as any;
const META_GRAPH_URL = "https://graph.facebook.com/v24.0";
const embeddingModel = "openai/text-embedding-ada-002";

async function getAccountIdsForUser(
    ctx: Parameters<typeof AccountsRead.listByUser>[0],
    userId: string,
    clientId?: Id<"clients">,
) {
    const accounts = clientId
        ? await AccountsRead.listByClient(ctx, userId, clientId)
        : await AccountsRead.listByUser(ctx, userId);
    return accounts.map((acc) => acc._id);
}

const generateVideoChunks = (video: {
    title?: string | null;
    description?: string | null;
    caption?: string | null;
    platform: string;
}): string[] => {
    const chunks: string[] = [];

    if (video.title) {
        chunks.push(`Title: ${video.title}`);
    }

    const textContent = [video.description, video.caption]
        .filter(Boolean)
        .join(" ");

    if (textContent) {
        const sentences = textContent
            .trim()
            .split(/[.!?]+/)
            .filter((sentence) => sentence.trim().length > 10);
        chunks.push(...sentences);
    }

    if (chunks.length > 0) {
        chunks[0] = `[${video.platform}] ${chunks[0]}`;
    }

    return chunks;
};

async function generateVideoEmbeddings(
    ctx: { runMutation: (...args: any[]) => Promise<any> },
    videoId: string,
    video: {
        title?: string | null;
        description?: string | null;
        caption?: string | null;
        platform: string;
    },
) {
    const chunks = generateVideoChunks(video);
    if (chunks.length === 0) return;

    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks,
    });

    await ctx.runMutation(api.embeddings.insertMany, {
        resourceId: videoId,
        contents: chunks,
        embeddings,
    });
}

export const list = query({
    args: {
        platform: v.optional(v.string()),
        limit: v.optional(v.number()),
        clientId: v.optional(v.id("clients")),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const accountIds = await getAccountIdsForUser(
            ctx,
            userId,
            args.clientId,
        );
        return ContentRead.list(ctx, accountIds, {
            platform: args.platform,
            limit: args.limit,
        });
    },
});

export const stats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        const accountIds = await getAccountIdsForUser(ctx, userId);
        return ContentRead.stats(ctx, accountIds);
    },
});

export const statsByPlatform = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        const accountIds = await getAccountIdsForUser(ctx, userId);
        return ContentRead.statsByPlatform(ctx, accountIds);
    },
});

export const top = query({
    args: { limit: v.optional(v.number()), platform: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const accountIds = await getAccountIdsForUser(ctx, userId);
        return ContentRead.top(ctx, accountIds, {
            limit: args.limit,
            platform: args.platform,
        });
    },
});

export const topByMetric = query({
    args: {
        metric: v.string(),
        platform: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const accountIds = await getAccountIdsForUser(ctx, userId);
        return ContentRead.topByMetric(ctx, accountIds, {
            metric: args.metric,
            platform: args.platform,
            limit: args.limit,
        });
    },
});

export const recent = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const accountIds = await getAccountIdsForUser(ctx, userId);
        return ContentRead.recent(ctx, accountIds, args.limit ?? 10);
    },
});

export const upsertFromImport = mutation({
    args: {
        accountId: v.id("connectedAccounts"),
        platform: v.string(),
        platformVideoId: v.string(),
        mediaType: v.optional(v.union(v.string(), v.null())),
        title: v.optional(v.union(v.string(), v.null())),
        description: v.optional(v.union(v.string(), v.null())),
        caption: v.optional(v.union(v.string(), v.null())),
        thumbnailUrl: v.optional(v.union(v.string(), v.null())),
        mediaUrl: v.optional(v.union(v.string(), v.null())),
        views: v.optional(v.union(v.number(), v.null())),
        likes: v.optional(v.union(v.number(), v.null())),
        comments: v.optional(v.union(v.number(), v.null())),
        shares: v.optional(v.union(v.number(), v.null())),
        duration: v.optional(v.union(v.number(), v.null())),
        publishedAt: v.optional(v.union(v.number(), v.null())),
        rawData: v.optional(v.union(v.any(), v.null())),
    },
    handler: async (ctx, args) => {
        return ContentWrite.upsertFromImport(ctx, {
            accountId: args.accountId,
            platform: args.platform,
            platformVideoId: args.platformVideoId,
            mediaType: args.mediaType ?? null,
            title: args.title ?? null,
            description: args.description ?? null,
            caption: args.caption ?? null,
            thumbnailUrl: args.thumbnailUrl ?? null,
            mediaUrl: args.mediaUrl ?? null,
            views: args.views ?? null,
            likes: args.likes ?? null,
            comments: args.comments ?? null,
            shares: args.shares ?? null,
            duration: args.duration ?? null,
            publishedAt: args.publishedAt ?? null,
            rawData: args.rawData ?? null,
        });
    },
});

export const deleteByAccount = mutation({
    args: { accountId: v.id("connectedAccounts") },
    handler: async (ctx, args) => {
        return ContentWrite.deleteByAccountId(ctx, args.accountId);
    },
});

interface InstagramMedia {
    id: string;
    media_type: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    caption?: string;
    like_count?: number;
    comments_count?: number;
    insights?: {
        data: Array<{
            name: string;
            values: Array<{ value: number }>;
        }>;
    };
}

interface InstagramApiResponse {
    data: InstagramMedia[];
}

interface FacebookVideo {
    id: string;
    title?: string;
    description?: string;
    permalink_url: string;
    created_time: string;
    length?: number;
    thumbnails?: {
        data: Array<{ uri: string }>;
    };
    views?: number;
    likes?: {
        summary: { total_count: number };
    };
    comments?: {
        summary: { total_count: number };
    };
}

interface FacebookApiResponse {
    data: FacebookVideo[];
}

export const syncInstagram = action({
    args: {},
    handler: async (ctx) => {
        await requireUserId(ctx);

        try {
            const accounts = await ctx.runQuery(api.accounts.listByPlatform, {
                platform: "instagram",
            });

            if (accounts.length === 0) {
                return { success: false, error: "Instagram not connected" };
            }

            let totalSynced = 0;

            for (const account of accounts) {
                const igAccountId = account.platformUserId;
                const accessToken = account.accessToken;

                const mediaRes = await fetch(
                    `${META_GRAPH_URL}/${igAccountId}/media?` +
                        `fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,` +
                        `like_count,comments_count,insights.metric(views,reach,saved,shares)` +
                        `&limit=50` +
                        `&access_token=${accessToken}`,
                );

                const mediaData = await mediaRes.json();

                if (mediaData.error) {
                    console.error("Instagram API error:", mediaData.error);
                    return { success: false, error: mediaData.error.message };
                }

                for (const media of mediaData.data || []) {
                    const insights =
                        media.insights?.data?.reduce(
                            (acc: Record<string, number>, item: any) => {
                                acc[item.name] = item.values?.[0]?.value || 0;
                                return acc;
                            },
                            {},
                        ) || {};

                    const { doc, inserted } = await ctx.runMutation(
                        api.content.upsertFromImport,
                        {
                            accountId: account._id,
                            platform: "instagram",
                            platformVideoId: media.id,
                            mediaType: media.media_type,
                            title: null,
                            description: media.caption,
                            caption: media.caption,
                            thumbnailUrl:
                                media.thumbnail_url || media.media_url,
                            mediaUrl: media.permalink,
                            views: insights.views || 0,
                            likes: media.like_count || 0,
                            comments: media.comments_count || 0,
                            shares: insights.shares || 0,
                            publishedAt: new Date(media.timestamp).getTime(),
                            rawData: media,
                        },
                    );

                    if (inserted && doc && media.caption) {
                        try {
                            await generateVideoEmbeddings(ctx, doc._id, {
                                title: null,
                                description: media.caption,
                                caption: media.caption,
                                platform: "instagram",
                            });
                        } catch (error) {
                            console.error("Embedding generation error:", error);
                        }
                    }

                    totalSynced++;
                }
            }

            return {
                success: true,
                synced: totalSynced,
                message: `Synced ${totalSynced} Instagram posts`,
            };
        } catch (error) {
            console.error("Instagram sync error:", error);
            return { success: false, error: "Failed to sync Instagram" };
        }
    },
});

export const syncFacebook = action({
    args: {},
    handler: async (ctx) => {
        await requireUserId(ctx);

        try {
            const accounts = await ctx.runQuery(api.accounts.listByPlatform, {
                platform: "facebook",
            });

            if (accounts.length === 0) {
                return { success: false, error: "Facebook not connected" };
            }

            let totalSynced = 0;

            for (const account of accounts) {
                const pageId = account.platformUserId;
                const accessToken = account.accessToken;

                const videosRes = await fetch(
                    `${META_GRAPH_URL}/${pageId}/videos?` +
                        `fields=id,title,description,permalink_url,created_time,length,` +
                        `thumbnails,views,likes.summary(true),comments.summary(true)` +
                        `&limit=50` +
                        `&access_token=${accessToken}`,
                );

                const videosData = await videosRes.json();

                if (videosData.error) {
                    console.error("Facebook API error:", videosData.error);
                    continue;
                }

                for (const video of videosData.data || []) {
                    const { doc, inserted } = await ctx.runMutation(
                        api.content.upsertFromImport,
                        {
                            accountId: account._id,
                            platform: "facebook",
                            platformVideoId: video.id,
                            mediaType: "VIDEO",
                            title: video.title,
                            description: video.description,
                            caption: video.description,
                            thumbnailUrl: video.thumbnails?.data?.[0]?.uri,
                            mediaUrl: video.permalink_url,
                            views: video.views || 0,
                            likes: video.likes?.summary?.total_count || 0,
                            comments: video.comments?.summary?.total_count || 0,
                            shares: 0,
                            duration: video.length,
                            publishedAt: new Date(video.created_time).getTime(),
                            rawData: video,
                        },
                    );

                    if (inserted && doc && (video.title || video.description)) {
                        try {
                            await generateVideoEmbeddings(ctx, doc._id, {
                                title: video.title,
                                description: video.description,
                                caption: null,
                                platform: "facebook",
                            });
                        } catch (error) {
                            console.error("Embedding generation error:", error);
                        }
                    }

                    totalSynced++;
                }
            }

            return {
                success: true,
                synced: totalSynced,
                message: `Synced ${totalSynced} Facebook videos`,
            };
        } catch (error) {
            console.error("Facebook sync error:", error);
            return { success: false, error: "Failed to sync Facebook" };
        }
    },
});

export const importInstagramData = action({
    args: { clientId: v.id("clients"), jsonData: v.string() },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);

        try {
            let client;
            try {
                client = await ctx.runQuery(api.clients.get, {
                    clientId: args.clientId,
                });
            } catch {
                return { success: false, error: "Client not found" };
            }
            if (!client) {
                return { success: false, error: "Client not found" };
            }

            let apiResponse: InstagramApiResponse;
            try {
                apiResponse = JSON.parse(args.jsonData);
            } catch {
                return { success: false, error: "Invalid JSON format" };
            }

            if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
                return {
                    success: false,
                    error: "Invalid API response format. Expected { data: [...] }",
                };
            }

            const accounts: Array<{
                _id: Id<"connectedAccounts">;
                platform: string;
            }> = await ctx.runQuery(api.accounts.listByClient, {
                clientId: args.clientId,
            });

            let account = accounts.find((acc) => acc.platform === "instagram");

            if (!account) {
                account = await ctx.runMutation(api.accounts.upsert, {
                    userId,
                    clientId: args.clientId,
                    platform: "instagram",
                    accessToken: `mock_token_${nanoid()}`,
                    platformUserId: `mock_ig_${nanoid()}`,
                    platformUsername: client.name
                        .toLowerCase()
                        .replace(/\s+/g, "_"),
                });
            }
            if (!account) {
                return { success: false, error: "Account not found" };
            }

            let imported = 0;

            for (const media of apiResponse.data) {
                const insights =
                    media.insights?.data?.reduce(
                        (acc: Record<string, number>, item: any) => {
                            acc[item.name] = item.values?.[0]?.value || 0;
                            return acc;
                        },
                        {},
                    ) || {};

                const { doc, inserted } = await ctx.runMutation(
                    api.content.upsertFromImport,
                    {
                        accountId: account._id,
                        platform: "instagram",
                        platformVideoId: media.id,
                        mediaType: media.media_type,
                        title: null,
                        description: media.caption || null,
                        caption: media.caption || null,
                        thumbnailUrl:
                            media.thumbnail_url || media.media_url || null,
                        mediaUrl: media.permalink,
                        views: insights.views || 0,
                        likes: media.like_count || 0,
                        comments: media.comments_count || 0,
                        shares: insights.shares || 0,
                        publishedAt: new Date(media.timestamp).getTime(),
                        rawData: media,
                    },
                );

                if (inserted && doc && media.caption) {
                    try {
                        await generateVideoEmbeddings(ctx, doc._id, {
                            title: null,
                            description: media.caption,
                            caption: media.caption,
                            platform: "instagram",
                        });
                    } catch (error) {
                        console.error("Embedding generation error:", error);
                    }
                }

                imported++;
            }

            return {
                success: true,
                imported,
                message: `Imported ${imported} Instagram posts`,
            };
        } catch (error) {
            console.error("Import Instagram error:", error);
            return { success: false, error: "Failed to import Instagram data" };
        }
    },
});

export const importFacebookData = action({
    args: { clientId: v.id("clients"), jsonData: v.string() },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);

        try {
            let client;
            try {
                client = await ctx.runQuery(api.clients.get, {
                    clientId: args.clientId,
                });
            } catch {
                return { success: false, error: "Client not found" };
            }
            if (!client) {
                return { success: false, error: "Client not found" };
            }

            let apiResponse: FacebookApiResponse;
            try {
                apiResponse = JSON.parse(args.jsonData);
            } catch {
                return { success: false, error: "Invalid JSON format" };
            }

            if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
                return {
                    success: false,
                    error: "Invalid API response format. Expected { data: [...] }",
                };
            }

            const accounts: Array<{
                _id: Id<"connectedAccounts">;
                platform: string;
            }> = await ctx.runQuery(api.accounts.listByClient, {
                clientId: args.clientId,
            });
            let account = accounts.find((acc) => acc.platform === "facebook");

            if (!account) {
                account = await ctx.runMutation(api.accounts.upsert, {
                    userId,
                    clientId: args.clientId,
                    platform: "facebook",
                    accessToken: `mock_token_${nanoid()}`,
                    platformUserId: `mock_fb_${nanoid()}`,
                    platformUsername: client.name
                        .toLowerCase()
                        .replace(/\s+/g, "_"),
                });
            }
            if (!account) {
                return { success: false, error: "Account not found" };
            }

            let imported = 0;

            for (const video of apiResponse.data) {
                const { doc, inserted } = await ctx.runMutation(
                    api.content.upsertFromImport,
                    {
                        accountId: account._id,
                        platform: "facebook",
                        platformVideoId: video.id,
                        mediaType: "VIDEO",
                        title: video.title || null,
                        description: video.description || null,
                        caption: video.description || null,
                        thumbnailUrl: video.thumbnails?.data?.[0]?.uri || null,
                        mediaUrl: video.permalink_url,
                        views: video.views || 0,
                        likes: video.likes?.summary?.total_count || 0,
                        comments: video.comments?.summary?.total_count || 0,
                        shares: 0,
                        duration: video.length || null,
                        publishedAt: new Date(video.created_time).getTime(),
                        rawData: video,
                    },
                );

                if (inserted && doc && (video.title || video.description)) {
                    try {
                        await generateVideoEmbeddings(ctx, doc._id, {
                            title: video.title || null,
                            description: video.description || null,
                            caption: null,
                            platform: "facebook",
                        });
                    } catch (error) {
                        console.error("Embedding generation error:", error);
                    }
                }

                imported++;
            }

            return {
                success: true,
                imported,
                message: `Imported ${imported} Facebook videos`,
            };
        } catch (error) {
            console.error("Import Facebook error:", error);
            return { success: false, error: "Failed to import Facebook data" };
        }
    },
});
