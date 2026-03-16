import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyAdminUserId, requireAgencyAdminUserId } from "./_lib/auth";
import * as ClientsRead from "./db/clients/read";
import * as AutoblogRead from "./db/autoblog/read";
import * as AutoblogWrite from "./db/autoblog/write";

const postingCadenceValidator = v.union(
    v.literal("weekly"),
    v.literal("biweekly"),
    v.literal("monthly"),
);
const ideaStatusValidator = v.union(
    v.literal("pending_review"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("converted_to_post"),
);
const postStatusValidator = v.union(
    v.literal("draft"),
    v.literal("scheduled"),
    v.literal("publishing"),
    v.literal("published"),
    v.literal("failed"),
);
const approvalStatusValidator = v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
);

export const getSettings = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return null;
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return null;
        }
        return AutoblogRead.getSettingsByClient(ctx, args.clientId);
    },
});

export const listPosts = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return [];
        }
        return AutoblogRead.listPostsByClient(ctx, args.clientId);
    },
});

export const saveGithubInstallation = mutation({
    args: {
        clientId: v.id("clients"),
        installationId: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return AutoblogWrite.upsertSettings(ctx, {
            clientId: args.clientId,
            githubInstallationId: args.installationId,
        });
    },
});

export const upsertSettings = mutation({
    args: {
        clientId: v.id("clients"),
        repoOwner: v.optional(v.union(v.string(), v.null())),
        repoName: v.optional(v.union(v.string(), v.null())),
        contentPath: v.optional(v.union(v.string(), v.null())),
        defaultBranch: v.optional(v.union(v.string(), v.null())),
        githubInstallationId: v.optional(v.union(v.number(), v.null())),
        isActive: v.optional(v.boolean()),
        config: v.optional(
            v.object({
                postingCadence: v.optional(postingCadenceValidator),
                topicSeeds: v.optional(v.union(v.array(v.string()), v.null())),
                requiresApproval: v.optional(v.boolean()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Client not found");
        }

        return AutoblogWrite.upsertSettings(ctx, {
            clientId: args.clientId,
            repoOwner: args.repoOwner ?? null,
            repoName: args.repoName ?? null,
            contentPath: args.contentPath ?? null,
            defaultBranch: args.defaultBranch ?? null,
            githubInstallationId: args.githubInstallationId ?? null,
            isActive: args.isActive ?? null,
            config: args.config ?? undefined,
        });
    },
});

// Ideas queries and mutations
export const listIdeas = query({
    args: {
        clientId: v.id("clients"),
        status: v.optional(ideaStatusValidator),
    },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return [];
        }
        return AutoblogRead.listIdeasByClient(ctx, args.clientId, args.status);
    },
});

export const getIdea = query({
    args: { ideaId: v.id("autoblogIdeas") },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return null;
        const idea = await AutoblogRead.getIdeaById(ctx, args.ideaId);
        if (!idea) return null;

        const client = await ClientsRead.getById(ctx, idea.clientId);
        if (!client || client.userId !== userId) {
            return null;
        }
        return idea;
    },
});

export const updateIdeaStatus = mutation({
    args: {
        ideaId: v.id("autoblogIdeas"),
        status: ideaStatusValidator,
    },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const idea = await AutoblogRead.getIdeaById(ctx, args.ideaId);
        if (!idea) throw new Error("Idea not found");

        const client = await ClientsRead.getById(ctx, idea.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return AutoblogWrite.updateIdeaStatus(ctx, {
            ideaId: args.ideaId,
            status: args.status,
        });
    },
});

export const createManualIdea = mutation({
    args: {
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        keywords: v.optional(v.array(v.string())),
        targetWordCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return AutoblogWrite.createIdea(ctx, {
            clientId: args.clientId,
            title: args.title,
            description: args.description ?? null,
            keywords: args.keywords ?? null,
            targetWordCount: args.targetWordCount ?? null,
            generatedBy: "manual",
        });
    },
});

// Posts queries and mutations
export const getPost = query({
    args: { postId: v.id("autoblogPosts") },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return null;
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) return null;

        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            return null;
        }
        return post;
    },
});

export const listPostsForCalendar = query({
    args: {
        clientId: v.id("clients"),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return [];
        }
        return AutoblogRead.listPostsForCalendar(
            ctx,
            args.clientId,
            args.startDate,
            args.endDate,
        );
    },
});

export const updatePost = mutation({
    args: {
        postId: v.id("autoblogPosts"),
        title: v.optional(v.string()),
        slug: v.optional(v.string()),
        content: v.optional(v.string()),
        excerpt: v.optional(v.union(v.string(), v.null())),
        metadata: v.optional(
            v.object({
                featuredImage: v.optional(v.union(v.string(), v.null())),
                author: v.optional(v.union(v.string(), v.null())),
                tags: v.optional(v.union(v.array(v.string()), v.null())),
                readingTime: v.optional(v.union(v.number(), v.null())),
            }),
        ),
        status: v.optional(postStatusValidator),
        approvalStatus: v.optional(v.union(approvalStatusValidator, v.null())),
    },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) throw new Error("Post not found");

        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return AutoblogWrite.updatePost(ctx, {
            postId: args.postId,
            title: args.title,
            slug: args.slug,
            content: args.content,
            excerpt: args.excerpt,
            metadata: args.metadata,
            status: args.status,
            approvalStatus: args.approvalStatus,
        });
    },
});

export const deletePost = mutation({
    args: { postId: v.id("autoblogPosts") },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) throw new Error("Post not found");

        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return AutoblogWrite.deletePost(ctx, { postId: args.postId });
    },
});

export const approvePost = mutation({
    args: { postId: v.id("autoblogPosts") },
    handler: async (ctx, args) => {
        const userId = await requireAgencyAdminUserId(ctx);
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) throw new Error("Post not found");

        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return AutoblogWrite.updatePost(ctx, {
            postId: args.postId,
            approvalStatus: "approved",
        });
    },
});

export const listPublishLogs = query({
    args: { postId: v.id("autoblogPosts") },
    handler: async (ctx, args) => {
        const userId = await getAgencyAdminUserId(ctx);
        if (!userId) return [];
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) return [];

        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            return [];
        }
        return AutoblogRead.listPublishLogsByPost(ctx, args.postId);
    },
});
