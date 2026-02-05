"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const publishPost = internalAction({
    args: { postId: v.id("autoblogPosts") },
    handler: async (ctx, args): Promise<{
        success: boolean;
        commitSha?: string;
        error?: string;
    }> => {
        // Get the post using internal query
        const post = await ctx.runQuery(internal.autoblogInternal.getPost as any, {
            postId: args.postId,
        });

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        // Check if post is already published
        if (post.status === "published") {
            return { success: false, error: "Post already published" };
        }

        // Get autoblog settings
        const settings = await ctx.runQuery(internal.autoblogInternal.getSettings as any, {
            clientId: post.clientId,
        });

        if (!settings) {
            return { success: false, error: "Autoblog not configured" };
        }

        // Get the attempt number for logging
        const existingLogs = await ctx.runQuery(api.autoblog.listPublishLogs, {
            postId: args.postId,
        });
        const attemptNumber = existingLogs.length + 1;

        // Update status to publishing
        await ctx.runMutation(internal.autoblogInternal.updatePostPublishStatus as any, {
            postId: args.postId,
            status: "publishing",
        });

        try {
            // Generate file path
            const contentPath = settings.contentPath || "content/blog";
            const filePath = `${contentPath}/${post.slug}.mdx`;

            // Commit the file to GitHub
            const result = await ctx.runAction(api.github.commitFile, {
                clientId: post.clientId,
                filePath,
                content: post.content,
                commitMessage: `Add blog post: ${post.title}`,
            });

            if (!result.success) {
                // Log the failure
                await ctx.runMutation(internal.autoblogInternal.createPublishLog as any, {
                    postId: args.postId,
                    clientId: post.clientId,
                    status: "failed",
                    errorMessage: result.error || "Unknown error",
                    attemptNumber,
                });

                // Update post status to failed
                await ctx.runMutation(internal.autoblogInternal.updatePostPublishStatus as any, {
                    postId: args.postId,
                    status: "failed",
                });

                return { success: false, error: result.error };
            }

            // Log the success
            await ctx.runMutation(internal.autoblogInternal.createPublishLog as any, {
                postId: args.postId,
                clientId: post.clientId,
                status: "success",
                commitSha: result.commitSha,
                attemptNumber,
            });

            // Update post status to published
            await ctx.runMutation(internal.autoblogInternal.updatePostPublishStatus as any, {
                postId: args.postId,
                status: "published",
                githubCommitSha: result.commitSha,
                filePath,
                publishedAt: Date.now(),
            });

            return { success: true, commitSha: result.commitSha };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            // Log the failure
            await ctx.runMutation(internal.autoblogInternal.createPublishLog as any, {
                postId: args.postId,
                clientId: post.clientId,
                status: "failed",
                errorMessage,
                attemptNumber,
            });

            // Update post status to failed
            await ctx.runMutation(internal.autoblogInternal.updatePostPublishStatus as any, {
                postId: args.postId,
                status: "failed",
            });

            return { success: false, error: errorMessage };
        }
    },
});
