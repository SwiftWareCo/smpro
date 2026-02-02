import { defineTable } from "convex/server";
import { v } from "convex/values";

export const connectedAccounts = defineTable({
    userId: v.string(),
    clientId: v.optional(v.union(v.id("clients"), v.null())),
    platform: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.union(v.string(), v.null())),
    platformUserId: v.optional(v.union(v.string(), v.null())),
    platformUsername: v.optional(v.union(v.string(), v.null())),
    clientBusinessId: v.optional(v.union(v.string(), v.null())),
    tokenExpiresAt: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_user_id", ["userId"])
    .index("by_client_id", ["clientId"])
    .index("by_platform_user", ["userId", "platform", "platformUserId"]);
