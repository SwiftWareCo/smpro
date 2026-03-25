import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import * as AutoblogRead from "./db/autoblog/read";
import * as AutoblogWrite from "./db/autoblog/write";

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

// Internal queries (for use in actions)
export const getSettings = internalQuery({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        return AutoblogRead.getSettingsByClient(ctx, args.clientId);
    },
});

export const getIdea = internalQuery({
    args: { ideaId: v.id("autoblogIdeas") },
    handler: async (ctx, args) => {
        return AutoblogRead.getIdeaById(ctx, args.ideaId);
    },
});

export const getPost = internalQuery({
    args: { postId: v.id("autoblogPosts") },
    handler: async (ctx, args) => {
        return AutoblogRead.getPostById(ctx, args.postId);
    },
});

export const listIdeas = internalQuery({
    args: {
        clientId: v.id("clients"),
        status: v.optional(ideaStatusValidator),
    },
    handler: async (ctx, args) => {
        return AutoblogRead.listIdeasByClient(ctx, args.clientId, args.status);
    },
});

// Internal mutations (for use in actions)
export const createIdea = internalMutation({
    args: {
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.union(v.string(), v.null())),
        keywords: v.optional(v.union(v.array(v.string()), v.null())),
        targetWordCount: v.optional(v.union(v.number(), v.null())),
        suggestedPublishDate: v.optional(v.union(v.number(), v.null())),
        generatedBy: v.union(v.literal("ai"), v.literal("manual")),
        aiPrompt: v.optional(v.union(v.string(), v.null())),
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.createIdea(ctx, {
            clientId: args.clientId,
            title: args.title,
            description: args.description,
            keywords: args.keywords,
            targetWordCount: args.targetWordCount,
            suggestedPublishDate: args.suggestedPublishDate,
            generatedBy: args.generatedBy,
            aiPrompt: args.aiPrompt,
        });
    },
});

export const updateIdeaStatus = internalMutation({
    args: {
        ideaId: v.id("autoblogIdeas"),
        status: ideaStatusValidator,
        postId: v.optional(v.union(v.id("autoblogPosts"), v.null())),
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.updateIdeaStatus(ctx, {
            ideaId: args.ideaId,
            status: args.status,
            postId: args.postId,
        });
    },
});

export const createPost = internalMutation({
    args: {
        clientId: v.id("clients"),
        ideaId: v.optional(v.union(v.id("autoblogIdeas"), v.null())),
        title: v.string(),
        slug: v.string(),
        content: v.string(),
        excerpt: v.optional(v.union(v.string(), v.null())),
        metadata: v.object({
            featuredImage: v.optional(v.union(v.string(), v.null())),
            author: v.optional(v.union(v.string(), v.null())),
            tags: v.optional(v.union(v.array(v.string()), v.null())),
            readingTime: v.optional(v.union(v.number(), v.null())),
        }),
        status: v.optional(postStatusValidator),
        scheduledFor: v.optional(v.union(v.number(), v.null())),
        approvalStatus: v.optional(v.union(approvalStatusValidator, v.null())),
        generation: v.optional(
            v.object({
                model: v.string(),
                provider: v.optional(v.union(v.string(), v.null())),
                promptTokens: v.optional(v.union(v.number(), v.null())),
                completionTokens: v.optional(v.union(v.number(), v.null())),
                cost: v.optional(v.union(v.number(), v.null())),
                generatedAt: v.number(),
            }),
        ),
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.createPost(ctx, {
            clientId: args.clientId,
            ideaId: args.ideaId,
            title: args.title,
            slug: args.slug,
            content: args.content,
            excerpt: args.excerpt,
            metadata: args.metadata,
            status: args.status,
            scheduledFor: args.scheduledFor,
            approvalStatus: args.approvalStatus,
            generation: args.generation ?? undefined,
        });
    },
});

export const updatePost = internalMutation({
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

export const deletePost = internalMutation({
    args: {
        postId: v.id("autoblogPosts"),
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.deletePost(ctx, { postId: args.postId });
    },
});

export const updatePostSchedule = internalMutation({
    args: {
        postId: v.id("autoblogPosts"),
        scheduledFor: v.union(v.number(), v.null()),
        scheduledFunctionId: v.union(v.id("_scheduled_functions"), v.null()),
        status: postStatusValidator,
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.updatePostSchedule(ctx, {
            postId: args.postId,
            scheduledFor: args.scheduledFor,
            scheduledFunctionId: args.scheduledFunctionId,
            status: args.status,
        });
    },
});

export const updatePostPublishStatus = internalMutation({
    args: {
        postId: v.id("autoblogPosts"),
        status: postStatusValidator,
        githubCommitSha: v.optional(v.union(v.string(), v.null())),
        filePath: v.optional(v.union(v.string(), v.null())),
        publishedAt: v.optional(v.union(v.number(), v.null())),
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.updatePostPublishStatus(ctx, {
            postId: args.postId,
            status: args.status,
            githubCommitSha: args.githubCommitSha,
            filePath: args.filePath,
            publishedAt: args.publishedAt,
        });
    },
});

export const createPublishLog = internalMutation({
    args: {
        postId: v.id("autoblogPosts"),
        clientId: v.id("clients"),
        status: v.union(v.literal("success"), v.literal("failed")),
        githubResponse: v.optional(v.union(v.string(), v.null())),
        errorMessage: v.optional(v.union(v.string(), v.null())),
        commitSha: v.optional(v.union(v.string(), v.null())),
        attemptNumber: v.number(),
        nextRetryAt: v.optional(v.union(v.number(), v.null())),
    },
    handler: async (ctx, args) => {
        return AutoblogWrite.createPublishLog(ctx, {
            postId: args.postId,
            clientId: args.clientId,
            status: args.status,
            githubResponse: args.githubResponse,
            errorMessage: args.errorMessage,
            commitSha: args.commitSha,
            attemptNumber: args.attemptNumber,
            nextRetryAt: args.nextRetryAt,
        });
    },
});
