import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAgencyAdminUserId, getAgencyAdminUserId } from "./_lib/auth";
import * as UsageRead from "./db/usageCounters/read";
import * as UsageWrite from "./db/usageCounters/write";

// Internal mutation for Convex actions to call via ctx.runMutation
export const trackUsage = internalMutation({
    args: {
        clientId: v.id("clients"),
        service: v.string(),
        callCount: v.optional(v.number()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await UsageWrite.incrementUsage(ctx, {
            clientId: args.clientId,
            service: args.service,
            callCount: args.callCount,
            promptTokens: args.promptTokens,
            completionTokens: args.completionTokens,
        });
    },
});

// Public mutation for Next.js API routes to call via fetchMutation
export const recordUsage = mutation({
    args: {
        clientId: v.id("clients"),
        service: v.string(),
        callCount: v.optional(v.number()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireAgencyAdminUserId(ctx);
        await UsageWrite.incrementUsage(ctx, {
            clientId: args.clientId,
            service: args.service,
            callCount: args.callCount,
            promptTokens: args.promptTokens,
            completionTokens: args.completionTokens,
        });
    },
});

// Per-client usage for a single month
export const getClientUsage = query({
    args: {
        clientId: v.id("clients"),
        periodKey: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        return UsageRead.getByClientAndPeriod(ctx, args.clientId, args.periodKey);
    },
});

// Per-client usage across multiple months (for charts)
export const getClientUsageRange = query({
    args: {
        clientId: v.id("clients"),
        periodKeys: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        return UsageRead.getByClientServiceRange(
            ctx,
            args.clientId,
            args.periodKeys,
        );
    },
});

// One-time cleanup: fix any NaN rows in usageCounters (run from dashboard, then remove)
export const fixNaNUsageRows = internalMutation({
    handler: async (ctx) => {
        const allRows = await ctx.db.query("usageCounters").collect();
        let fixed = 0;
        for (const row of allRows) {
            if (
                !Number.isFinite(row.promptTokens) ||
                !Number.isFinite(row.completionTokens) ||
                !Number.isFinite(row.callCount)
            ) {
                await ctx.db.patch(row._id, {
                    callCount: Number.isFinite(row.callCount)
                        ? row.callCount
                        : 0,
                    promptTokens: Number.isFinite(row.promptTokens)
                        ? row.promptTokens
                        : 0,
                    completionTokens: Number.isFinite(row.completionTokens)
                        ? row.completionTokens
                        : 0,
                });
                fixed++;
            }
        }
        return { fixed, total: allRows.length };
    },
});

// Agency-wide usage for a single month (all clients)
export const getAgencyUsage = query({
    args: {
        periodKey: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        return UsageRead.getByPeriod(ctx, args.periodKey);
    },
});
