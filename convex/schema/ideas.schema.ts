import { defineTable } from "convex/server";
import { v } from "convex/values";

export const savedIdeas = defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    confidence: v.optional(v.number()),
    basedOnVideoIds: v.optional(v.union(v.array(v.string()), v.null())),
    isTrending: v.optional(v.boolean()),
    createdAt: v.number(),
}).index("by_user_id", ["userId"]);
