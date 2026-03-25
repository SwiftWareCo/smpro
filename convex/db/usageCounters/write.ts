import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

function getCurrentPeriodKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

export async function incrementUsage(
    ctx: MutationCtx,
    args: {
        clientId: Id<"clients">;
        service: string;
        callCount?: number;
        promptTokens?: number;
        completionTokens?: number;
    },
) {
    const periodKey = getCurrentPeriodKey();
    const rawCallCount = args.callCount ?? 1;
    const rawPromptTokens = args.promptTokens ?? 0;
    const rawCompletionTokens = args.completionTokens ?? 0;
    const callCount = Number.isFinite(rawCallCount) ? rawCallCount : 0;
    const promptTokens = Number.isFinite(rawPromptTokens) ? rawPromptTokens : 0;
    const completionTokens = Number.isFinite(rawCompletionTokens)
        ? rawCompletionTokens
        : 0;

    const existing = await ctx.db
        .query("usageCounters")
        .withIndex("by_client_service_period", (q) =>
            q
                .eq("clientId", args.clientId)
                .eq("service", args.service)
                .eq("periodKey", periodKey),
        )
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            callCount: existing.callCount + callCount,
            promptTokens: existing.promptTokens + promptTokens,
            completionTokens: existing.completionTokens + completionTokens,
            updatedAt: Date.now(),
        });
    } else {
        await ctx.db.insert("usageCounters", {
            clientId: args.clientId,
            service: args.service,
            periodKey,
            callCount,
            promptTokens,
            completionTokens,
            updatedAt: Date.now(),
        });
    }
}
