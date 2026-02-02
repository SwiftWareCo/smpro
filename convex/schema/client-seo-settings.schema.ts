import { defineTable } from "convex/server";
import { v } from "convex/values";

export const clientSeoSettings = defineTable({
    clientId: v.id("clients"),
    websiteUrl: v.optional(v.union(v.string(), v.null())),
    targetKeywords: v.optional(v.union(v.array(v.string()), v.null())),
    targetLocations: v.optional(v.union(v.array(v.string()), v.null())),
    metaTitle: v.optional(v.union(v.string(), v.null())),
    metaDescription: v.optional(v.union(v.string(), v.null())),
    industry: v.optional(v.union(v.string(), v.null())),
    analyzedAt: v.optional(v.union(v.number(), v.null())),
    analysisProvider: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
}).index("by_client_id", ["clientId"]);
