import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

type PostingCadence = "weekly" | "biweekly" | "monthly";
type LayoutType = "callout" | "story" | "guide";

type AutoblogConfigInput = {
    postingCadence?: PostingCadence | null;
    postsPerMonth?: number | null;
    topicSeeds?: string[] | null;
    layout?: LayoutType | null;
    requiresApproval?: boolean | null;
    autoPublish?: boolean | null;
};

const DEFAULT_CONFIG = {
    postingCadence: "weekly" as const,
    postsPerMonth: 4,
    topicSeeds: null as string[] | null,
    layout: "callout" as LayoutType,
    requiresApproval: true,
    autoPublish: false,
};

export async function upsertSettings(
    ctx: MutationCtx,
    args: {
        clientId: Id<"clients">;
        repoOwner?: string | null;
        repoName?: string | null;
        contentPath?: string | null;
        defaultBranch?: string | null;
        githubInstallationId?: number | null;
        isActive?: boolean | null;
        config?: AutoblogConfigInput;
    },
) {
    const existing = await ctx.db
        .query("autoblogSettings")
        .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
        .first();

    const now = Date.now();
    const nextConfig = {
        postingCadence:
            args.config?.postingCadence ??
            existing?.config.postingCadence ??
            DEFAULT_CONFIG.postingCadence,
        postsPerMonth:
            args.config?.postsPerMonth ??
            existing?.config.postsPerMonth ??
            DEFAULT_CONFIG.postsPerMonth,
        topicSeeds:
            args.config?.topicSeeds ??
            existing?.config.topicSeeds ??
            DEFAULT_CONFIG.topicSeeds,
        layout:
            args.config?.layout ??
            existing?.config.layout ??
            DEFAULT_CONFIG.layout,
        requiresApproval:
            args.config?.requiresApproval ??
            existing?.config.requiresApproval ??
            DEFAULT_CONFIG.requiresApproval,
        autoPublish:
            args.config?.autoPublish ??
            existing?.config.autoPublish ??
            DEFAULT_CONFIG.autoPublish,
    };

    if (existing) {
        await ctx.db.patch(existing._id, {
            repoOwner: args.repoOwner ?? existing.repoOwner,
            repoName: args.repoName ?? existing.repoName,
            contentPath: args.contentPath ?? existing.contentPath,
            defaultBranch: args.defaultBranch ?? existing.defaultBranch,
            githubInstallationId:
                args.githubInstallationId ?? existing.githubInstallationId,
            isActive: args.isActive ?? existing.isActive,
            config: nextConfig,
            updatedAt: now,
        });
        return existing;
    }

    const recordId = await ctx.db.insert("autoblogSettings", {
        clientId: args.clientId,
        repoOwner: args.repoOwner ?? null,
        repoName: args.repoName ?? null,
        contentPath: args.contentPath ?? null,
        defaultBranch: args.defaultBranch ?? null,
        githubInstallationId: args.githubInstallationId ?? null,
        isActive: args.isActive ?? false,
        config: nextConfig,
        createdAt: now,
        updatedAt: now,
    });

    return ctx.db.get(recordId);
}
