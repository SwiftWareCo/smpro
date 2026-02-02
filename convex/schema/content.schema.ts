import { defineTable } from "convex/server";
import { v } from "convex/values";

export const content = defineTable({
    accountId: v.optional(v.union(v.id("connectedAccounts"), v.null())),
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
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_account_id", ["accountId"])
    .index("by_platform_video", ["platformVideoId"]);
