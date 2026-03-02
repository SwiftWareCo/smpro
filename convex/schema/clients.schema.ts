import { defineTable } from "convex/server";
import { v } from "convex/values";

export const clients = defineTable({
    userId: v.string(),
    name: v.string(),
    slug: v.string(),
    clerkOrganizationId: v.union(v.string(), v.null()),
    portalPrimaryColor: v.union(v.string(), v.null()),
    portalSecondaryColor: v.union(v.string(), v.null()),
    description: v.optional(v.union(v.string(), v.null())),
    avatarUrl: v.optional(v.union(v.string(), v.null())),
    status: v.string(),
    enabledModules: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_user_id", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_clerk_organization_id", ["clerkOrganizationId"])
    .index("by_status", ["status"]);
