import { defineTable } from "convex/server";
import { v } from "convex/values";

export const autoblogSettings = defineTable({
    clientId: v.id("clients"),
    repoOwner: v.optional(v.union(v.string(), v.null())),
    repoName: v.optional(v.union(v.string(), v.null())),
    contentPath: v.optional(v.union(v.string(), v.null())),
    defaultBranch: v.optional(v.union(v.string(), v.null())),
    githubInstallationId: v.optional(v.union(v.number(), v.null())),
    isActive: v.boolean(),
    config: v.object({
        postingCadence: v.union(
            v.literal("weekly"),
            v.literal("biweekly"),
            v.literal("monthly"),
        ),
        postsPerMonth: v.number(),
        topicSeeds: v.optional(v.union(v.array(v.string()), v.null())),
        layout: v.optional(
            v.union(
                v.literal("callout"),
                v.literal("story"),
                v.literal("guide"),
                v.null(),
            ),
        ),
        requiresApproval: v.boolean(),
        autoPublish: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client_id", ["clientId"])
    .index("by_active", ["isActive"]);

export const autoblogIdeas = defineTable({
    clientId: v.id("clients"),
    title: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    keywords: v.optional(v.union(v.array(v.string()), v.null())),
    targetWordCount: v.optional(v.union(v.number(), v.null())),
    status: v.union(
        v.literal("pending_review"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("converted_to_post"),
    ),
    suggestedPublishDate: v.optional(v.union(v.number(), v.null())),
    postId: v.optional(v.union(v.id("autoblogPosts"), v.null())),
    generatedBy: v.union(v.literal("ai"), v.literal("manual")),
    aiPrompt: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client", ["clientId"])
    .index("by_client_status", ["clientId", "status"])
    .index("by_status", ["status"]);

export const autoblogPosts = defineTable({
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
    status: v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("publishing"),
        v.literal("published"),
        v.literal("failed"),
    ),
    scheduledFor: v.optional(v.union(v.number(), v.null())),
    publishedAt: v.optional(v.union(v.number(), v.null())),
    githubCommitSha: v.optional(v.union(v.string(), v.null())),
    filePath: v.optional(v.union(v.string(), v.null())),
    generation: v.optional(
        v.object({
            model: v.string(),
            provider: v.optional(v.union(v.string(), v.null())),
            promptTokens: v.optional(v.union(v.number(), v.null())),
            cost: v.optional(v.union(v.number(), v.null())),
            generatedAt: v.number(),
        }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client", ["clientId"])
    .index("by_client_status", ["clientId", "status"])
    .index("by_schedule", ["status", "scheduledFor"])
    .index("by_slug", ["clientId", "slug"]);

export const autoblogPublishLogs = defineTable({
    postId: v.id("autoblogPosts"),
    clientId: v.id("clients"),
    attemptedAt: v.number(),
    status: v.union(v.literal("success"), v.literal("failed")),
    githubResponse: v.optional(v.union(v.string(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
    commitSha: v.optional(v.union(v.string(), v.null())),
    attemptNumber: v.number(),
    nextRetryAt: v.optional(v.union(v.number(), v.null())),
})
    .index("by_post", ["postId"])
    .index("by_client", ["clientId", "attemptedAt"]);
