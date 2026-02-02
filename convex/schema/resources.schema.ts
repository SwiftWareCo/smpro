import { defineTable } from "convex/server";
import { v } from "convex/values";

export const resources = defineTable({
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
});
