"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { generatePost } from "../lib/services/post-generation";
import { searchImages, type UnsplashImage } from "../lib/services/unsplash";

const layoutValidator = v.union(
    v.literal("callout"),
    v.literal("story"),
    v.literal("guide"),
);

export const generateFromIdea = action({
    args: {
        ideaId: v.id("autoblogIdeas"),
        layout: v.optional(layoutValidator),
        scheduledFor: v.optional(v.number()),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{
        success: boolean;
        postId?: string;
        error?: string;
    }> => {
        // Get the idea
        const idea = await ctx.runQuery(api.autoblog.getIdea, {
            ideaId: args.ideaId,
        });
        if (!idea) {
            return { success: false, error: "Idea not found" };
        }

        // Get autoblog settings
        const settings = await ctx.runQuery(api.autoblog.getSettings, {
            clientId: idea.clientId,
        });
        if (!settings) {
            return { success: false, error: "Autoblog not configured" };
        }

        // Get client data
        const client = await ctx.runQuery(api.clients.get, {
            clientId: idea.clientId,
        });
        if (!client) {
            return { success: false, error: "Client not found" };
        }

        // Get SEO settings
        const seoSettings = await ctx.runQuery(api.seo.getByClient, {
            clientId: idea.clientId,
        });

        // Search for a featured image on Unsplash
        let featuredImage: UnsplashImage | null = null;
        try {
            const searchQuery =
                idea.keywords?.[0] ||
                idea.title.split(" ").slice(0, 3).join(" ");
            const images = await searchImages(searchQuery, 1);
            if (images.length > 0) {
                featuredImage = images[0];
            }
        } catch (error) {
            console.error("Failed to fetch featured image:", error);
        }

        // Use layout from args, default to "callout"
        const layout = args.layout || "callout";

        // Generate the post
        const result = await generatePost({
            idea: {
                title: idea.title,
                description: idea.description || "",
                keywords: idea.keywords || [],
                targetWordCount: idea.targetWordCount || 1500,
            },
            layout,
            clientContext: {
                businessName: client.name,
                industry: seoSettings?.industry || "general",
                websiteUrl: seoSettings?.websiteUrl,
                targetKeywords: seoSettings?.targetKeywords || [],
            },
            featuredImage,
        });

        if (!result.success || !result.post) {
            return {
                success: false,
                error: result.error || "Failed to generate post",
            };
        }

        // Determine approval status based on settings
        const requiresApproval = settings.config.requiresApproval;
        const approvalStatus = requiresApproval ? "pending" : "approved";
        const status = args.scheduledFor ? "scheduled" : "draft";

        // Create the post
        const post = await ctx.runMutation(
            internal.autoblogInternal.createPost as any,
            {
                clientId: idea.clientId,
                ideaId: idea._id,
                title: result.post.title,
                slug: result.post.slug,
                content: result.post.content,
                excerpt: result.post.excerpt,
                metadata: result.post.metadata,
                status,
                scheduledFor: args.scheduledFor ?? null,
                approvalStatus,
                generation: result.post.generation,
            },
        );

        // Update idea status
        await ctx.runMutation(
            internal.autoblogInternal.updateIdeaStatus as any,
            {
                ideaId: idea._id,
                status: "converted_to_post",
                postId: post._id,
            },
        );

        // Track usage
        try {
            await ctx.runMutation(internal.usage.trackUsage, {
                clientId: idea.clientId,
                service: "blog_generation",
                promptTokens: result.post.generation.promptTokens ?? 0,
                completionTokens:
                    result.post.generation.completionTokens ?? 0,
            });
        } catch (e) {
            console.error("Blog generation usage tracking failed:", e);
        }

        return {
            success: true,
            postId: post._id,
        };
    },
});

export const regenerate = action({
    args: {
        postId: v.id("autoblogPosts"),
        layout: v.optional(layoutValidator),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{
        success: boolean;
        error?: string;
    }> => {
        // Get the post
        const post = await ctx.runQuery(api.autoblog.getPost, {
            postId: args.postId,
        });
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        // Get autoblog settings
        const settings = await ctx.runQuery(api.autoblog.getSettings, {
            clientId: post.clientId,
        });
        if (!settings) {
            return { success: false, error: "Autoblog not configured" };
        }

        // Get client data
        const client = await ctx.runQuery(api.clients.get, {
            clientId: post.clientId,
        });
        if (!client) {
            return { success: false, error: "Client not found" };
        }

        // Get SEO settings
        const seoSettings = await ctx.runQuery(api.seo.getByClient, {
            clientId: post.clientId,
        });

        // Get the original idea if exists
        let ideaData = {
            title: post.title,
            description: post.excerpt || "",
            keywords: post.metadata.tags || [],
            targetWordCount: 1500,
        };

        if (post.ideaId) {
            const idea = await ctx.runQuery(api.autoblog.getIdea, {
                ideaId: post.ideaId,
            });
            if (idea) {
                ideaData = {
                    title: idea.title,
                    description: idea.description || "",
                    keywords: idea.keywords || [],
                    targetWordCount: idea.targetWordCount || 1500,
                };
            }
        }

        // Search for a new featured image
        let featuredImage: UnsplashImage | null = null;
        try {
            const searchQuery =
                ideaData.keywords[0] ||
                ideaData.title.split(" ").slice(0, 3).join(" ");
            const images = await searchImages(searchQuery, 1);
            if (images.length > 0) {
                featuredImage = images[0];
            }
        } catch (error) {
            console.error("Failed to fetch featured image:", error);
        }

        // Determine layout
        const layout = args.layout || "callout";

        // Generate the post
        const result = await generatePost({
            idea: ideaData,
            layout,
            clientContext: {
                businessName: client.name,
                industry: seoSettings?.industry || "general",
                websiteUrl: seoSettings?.websiteUrl,
                targetKeywords: seoSettings?.targetKeywords || [],
            },
            featuredImage,
        });

        if (!result.success || !result.post) {
            return {
                success: false,
                error: result.error || "Failed to regenerate post",
            };
        }

        // Update the post
        await ctx.runMutation(internal.autoblogInternal.updatePost as any, {
            postId: post._id,
            title: result.post.title,
            slug: result.post.slug,
            content: result.post.content,
            excerpt: result.post.excerpt,
            metadata: result.post.metadata,
            status: "draft",
            approvalStatus: settings.config.requiresApproval
                ? "pending"
                : "approved",
        });

        // Track usage
        try {
            await ctx.runMutation(internal.usage.trackUsage, {
                clientId: post.clientId,
                service: "blog_generation",
                promptTokens: result.post.generation.promptTokens ?? 0,
                completionTokens:
                    result.post.generation.completionTokens ?? 0,
            });
        } catch (e) {
            console.error("Blog regeneration usage tracking failed:", e);
        }

        return { success: true };
    },
});
