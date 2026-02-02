import { defineTable } from "convex/server";
import { v } from "convex/values";

export const embeddings = defineTable({
    resourceId: v.optional(v.string()),
    content: v.string(),
    embedding: v.array(v.number()),
}).index("by_resource_id", ["resourceId"]);
