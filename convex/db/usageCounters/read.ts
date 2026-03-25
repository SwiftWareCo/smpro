import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function getByClientAndPeriod(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    periodKey: string,
) {
    return ctx.db
        .query("usageCounters")
        .withIndex("by_client_period", (q) =>
            q.eq("clientId", clientId).eq("periodKey", periodKey),
        )
        .collect();
}

export async function getByClientServiceRange(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    periodKeys: string[],
) {
    const results = [];
    for (const periodKey of periodKeys) {
        const rows = await ctx.db
            .query("usageCounters")
            .withIndex("by_client_period", (q) =>
                q.eq("clientId", clientId).eq("periodKey", periodKey),
            )
            .collect();
        results.push(...rows);
    }
    return results;
}

export async function getByPeriod(ctx: QueryCtx, periodKey: string) {
    return ctx.db
        .query("usageCounters")
        .withIndex("by_period", (q) => q.eq("periodKey", periodKey))
        .collect();
}
