import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function upsert(
    ctx: MutationCtx,
    args: {
        clientId: Id<"clients">;
        websiteUrl?: string | null;
        targetKeywords?: string[] | null;
        targetLocations?: string[] | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
        industry?: string | null;
        analyzedAt?: number | null;
        analysisProvider?: string | null;
    },
) {
    const existing = await ctx.db
        .query("clientSeoSettings")
        .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
        .first();

    const now = Date.now();

    if (existing) {
        await ctx.db.patch(existing._id, {
            websiteUrl: args.websiteUrl ?? existing.websiteUrl,
            targetKeywords: args.targetKeywords ?? existing.targetKeywords,
            targetLocations: args.targetLocations ?? existing.targetLocations,
            metaTitle: args.metaTitle ?? existing.metaTitle,
            metaDescription: args.metaDescription ?? existing.metaDescription,
            industry: args.industry ?? existing.industry,
            analyzedAt: args.analyzedAt ?? existing.analyzedAt,
            analysisProvider:
                args.analysisProvider ?? existing.analysisProvider,
            updatedAt: now,
        });
        return existing;
    }

    const recordId = await ctx.db.insert("clientSeoSettings", {
        clientId: args.clientId,
        websiteUrl: args.websiteUrl ?? null,
        targetKeywords: args.targetKeywords ?? null,
        targetLocations: args.targetLocations ?? null,
        metaTitle: args.metaTitle ?? null,
        metaDescription: args.metaDescription ?? null,
        industry: args.industry ?? null,
        analyzedAt: args.analyzedAt ?? null,
        analysisProvider: args.analysisProvider ?? null,
        createdAt: now,
        updatedAt: now,
    });
    return ctx.db.get(recordId);
}
