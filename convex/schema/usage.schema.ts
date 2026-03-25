import { defineTable } from "convex/server";
import { v } from "convex/values";

export const usageCounters = defineTable({
    clientId: v.id("clients"),
    service: v.string(),
    periodKey: v.string(),
    callCount: v.number(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    updatedAt: v.number(),
})
    .index("by_client_period", ["clientId", "periodKey"])
    .index("by_client_service_period", ["clientId", "service", "periodKey"])
    .index("by_period", ["periodKey"]);
