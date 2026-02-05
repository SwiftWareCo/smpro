import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

type PostingCadence = "weekly" | "biweekly" | "monthly";

type AutoblogConfigInput = {
    postingCadence?: PostingCadence | null;
    topicSeeds?: string[] | null;
    requiresApproval?: boolean | null;
};

const DEFAULT_CONFIG = {
    postingCadence: "weekly" as const,
    topicSeeds: null as string[] | null,
    requiresApproval: true,
};

export function getPostsPerMonth(cadence: PostingCadence): number {
    switch (cadence) {
        case "weekly":
            return 4;
        case "biweekly":
            return 2;
        case "monthly":
            return 1;
    }
}

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
        topicSeeds:
            args.config?.topicSeeds ??
            existing?.config.topicSeeds ??
            DEFAULT_CONFIG.topicSeeds,
        requiresApproval:
            args.config?.requiresApproval ??
            existing?.config.requiresApproval ??
            DEFAULT_CONFIG.requiresApproval,
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

type IdeaStatus =
    | "pending_review"
    | "approved"
    | "rejected"
    | "converted_to_post";
type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
type ApprovalStatus = "pending" | "approved" | "rejected";

export async function createIdea(
    ctx: MutationCtx,
    args: {
        clientId: Id<"clients">;
        title: string;
        description?: string | null;
        keywords?: string[] | null;
        targetWordCount?: number | null;
        suggestedPublishDate?: number | null;
        generatedBy: "ai" | "manual";
        aiPrompt?: string | null;
    },
) {
    const now = Date.now();
    const ideaId = await ctx.db.insert("autoblogIdeas", {
        clientId: args.clientId,
        title: args.title,
        description: args.description ?? null,
        keywords: args.keywords ?? null,
        targetWordCount: args.targetWordCount ?? null,
        status: "pending_review",
        suggestedPublishDate: args.suggestedPublishDate ?? null,
        postId: null,
        generatedBy: args.generatedBy,
        aiPrompt: args.aiPrompt ?? null,
        createdAt: now,
        updatedAt: now,
    });
    return ctx.db.get(ideaId);
}

export async function updateIdeaStatus(
    ctx: MutationCtx,
    args: {
        ideaId: Id<"autoblogIdeas">;
        status: IdeaStatus;
        postId?: Id<"autoblogPosts"> | null;
    },
) {
    const now = Date.now();
    await ctx.db.patch(args.ideaId, {
        status: args.status,
        postId: args.postId ?? undefined,
        updatedAt: now,
    });
    return ctx.db.get(args.ideaId);
}

export async function createPost(
    ctx: MutationCtx,
    args: {
        clientId: Id<"clients">;
        ideaId?: Id<"autoblogIdeas"> | null;
        title: string;
        slug: string;
        content: string;
        excerpt?: string | null;
        metadata: {
            featuredImage?: string | null;
            author?: string | null;
            tags?: string[] | null;
            readingTime?: number | null;
        };
        status?: PostStatus;
        scheduledFor?: number | null;
        approvalStatus?: ApprovalStatus | null;
        generation?: {
            model: string;
            provider?: string | null;
            promptTokens?: number | null;
            cost?: number | null;
            generatedAt: number;
        } | null;
    },
) {
    const now = Date.now();
    const postId = await ctx.db.insert("autoblogPosts", {
        clientId: args.clientId,
        ideaId: args.ideaId ?? null,
        title: args.title,
        slug: args.slug,
        content: args.content,
        excerpt: args.excerpt ?? null,
        metadata: {
            featuredImage: args.metadata.featuredImage ?? null,
            author: args.metadata.author ?? null,
            tags: args.metadata.tags ?? null,
            readingTime: args.metadata.readingTime ?? null,
        },
        status: args.status ?? "draft",
        scheduledFor: args.scheduledFor ?? null,
        publishedAt: null,
        githubCommitSha: null,
        filePath: null,
        scheduledFunctionId: null,
        approvalStatus: args.approvalStatus ?? null,
        generation: args.generation ?? undefined,
        createdAt: now,
        updatedAt: now,
    });
    return ctx.db.get(postId);
}

export async function updatePost(
    ctx: MutationCtx,
    args: {
        postId: Id<"autoblogPosts">;
        title?: string;
        slug?: string;
        content?: string;
        excerpt?: string | null;
        metadata?: {
            featuredImage?: string | null;
            author?: string | null;
            tags?: string[] | null;
            readingTime?: number | null;
        };
        status?: PostStatus;
        approvalStatus?: ApprovalStatus | null;
    },
) {
    const existing = await ctx.db.get(args.postId);
    if (!existing) {
        throw new Error("Post not found");
    }

    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (args.title !== undefined) updates.title = args.title;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.content !== undefined) updates.content = args.content;
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
    if (args.status !== undefined) updates.status = args.status;
    if (args.approvalStatus !== undefined)
        updates.approvalStatus = args.approvalStatus;

    if (args.metadata !== undefined) {
        updates.metadata = {
            featuredImage:
                args.metadata.featuredImage ?? existing.metadata.featuredImage,
            author: args.metadata.author ?? existing.metadata.author,
            tags: args.metadata.tags ?? existing.metadata.tags,
            readingTime:
                args.metadata.readingTime ?? existing.metadata.readingTime,
        };
    }

    await ctx.db.patch(args.postId, updates);
    return ctx.db.get(args.postId);
}

export async function deletePost(
    ctx: MutationCtx,
    args: { postId: Id<"autoblogPosts"> },
) {
    const existing = await ctx.db.get(args.postId);
    if (!existing) {
        throw new Error("Post not found");
    }
    await ctx.db.delete(args.postId);
}

export async function updatePostSchedule(
    ctx: MutationCtx,
    args: {
        postId: Id<"autoblogPosts">;
        scheduledFor: number | null;
        scheduledFunctionId: Id<"_scheduled_functions"> | null;
        status: PostStatus;
    },
) {
    const now = Date.now();
    await ctx.db.patch(args.postId, {
        scheduledFor: args.scheduledFor,
        scheduledFunctionId: args.scheduledFunctionId,
        status: args.status,
        updatedAt: now,
    });
    return ctx.db.get(args.postId);
}

export async function updatePostPublishStatus(
    ctx: MutationCtx,
    args: {
        postId: Id<"autoblogPosts">;
        status: PostStatus;
        githubCommitSha?: string | null;
        filePath?: string | null;
        publishedAt?: number | null;
    },
) {
    const now = Date.now();
    const updates: Record<string, unknown> = {
        status: args.status,
        updatedAt: now,
    };

    if (args.githubCommitSha !== undefined)
        updates.githubCommitSha = args.githubCommitSha;
    if (args.filePath !== undefined) updates.filePath = args.filePath;
    if (args.publishedAt !== undefined) updates.publishedAt = args.publishedAt;

    await ctx.db.patch(args.postId, updates);
    return ctx.db.get(args.postId);
}

export async function createPublishLog(
    ctx: MutationCtx,
    args: {
        postId: Id<"autoblogPosts">;
        clientId: Id<"clients">;
        status: "success" | "failed";
        githubResponse?: string | null;
        errorMessage?: string | null;
        commitSha?: string | null;
        attemptNumber: number;
        nextRetryAt?: number | null;
    },
) {
    const now = Date.now();
    const logId = await ctx.db.insert("autoblogPublishLogs", {
        postId: args.postId,
        clientId: args.clientId,
        attemptedAt: now,
        status: args.status,
        githubResponse: args.githubResponse ?? null,
        errorMessage: args.errorMessage ?? null,
        commitSha: args.commitSha ?? null,
        attemptNumber: args.attemptNumber,
        nextRetryAt: args.nextRetryAt ?? null,
    });
    return ctx.db.get(logId);
}
