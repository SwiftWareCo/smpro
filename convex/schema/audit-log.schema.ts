import { defineTable } from "convex/server";
import { v } from "convex/values";

export const auditLogs = defineTable({
    actor: v.string(),
    actorType: v.union(
        v.literal("user"),
        v.literal("system"),
        v.literal("patient"),
    ),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    ip: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
})
    .index("by_actor", ["actor"])
    .index("by_resource", ["resource", "resourceId"])
    .index("by_client_id", ["clientId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]);
