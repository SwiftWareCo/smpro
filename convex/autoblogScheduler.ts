import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUserId } from "./_lib/auth";
import * as ClientsRead from "./db/clients/read";
import * as AutoblogRead from "./db/autoblog/read";
import * as AutoblogWrite from "./db/autoblog/write";

export const schedulePost = mutation({
    args: {
        postId: v.id("autoblogPosts"),
        scheduledFor: v.number(),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{ success: boolean; scheduledFunctionId?: string }> => {
        const userId = await requireUserId(ctx);

        // Get the post
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        // Validate user owns the client
        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // Check if post can be scheduled
        if (post.status === "published") {
            throw new Error("Cannot schedule an already published post");
        }

        if (post.status === "publishing") {
            throw new Error(
                "Cannot schedule a post that is currently publishing",
            );
        }

        // Cancel existing scheduled function if any
        if (post.scheduledFunctionId) {
            try {
                await ctx.scheduler.cancel(post.scheduledFunctionId);
            } catch {
                // Ignore errors if the function was already executed or cancelled
            }
        }

        // Schedule the publish function
        const scheduledFunctionId = await ctx.scheduler.runAt(
            args.scheduledFor,
            internal.autoblogPublish.publishPost,
            { postId: args.postId },
        );

        // Update the post with the new schedule
        await AutoblogWrite.updatePostSchedule(ctx, {
            postId: args.postId,
            scheduledFor: args.scheduledFor,
            scheduledFunctionId,
            status: "scheduled",
        });

        return { success: true, scheduledFunctionId };
    },
});

export const reschedulePost = mutation({
    args: {
        postId: v.id("autoblogPosts"),
        newScheduledFor: v.number(),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{ success: boolean; scheduledFunctionId?: string }> => {
        const userId = await requireUserId(ctx);

        // Get the post
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        // Validate user owns the client
        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // Check if post can be rescheduled
        if (post.status === "published") {
            throw new Error("Cannot reschedule an already published post");
        }

        if (post.status === "publishing") {
            throw new Error(
                "Cannot reschedule a post that is currently publishing",
            );
        }

        // Cancel existing scheduled function if any
        if (post.scheduledFunctionId) {
            try {
                await ctx.scheduler.cancel(post.scheduledFunctionId);
            } catch {
                // Ignore errors if the function was already executed or cancelled
            }
        }

        // Schedule the new publish function
        const scheduledFunctionId = await ctx.scheduler.runAt(
            args.newScheduledFor,
            internal.autoblogPublish.publishPost,
            { postId: args.postId },
        );

        // Update the post with the new schedule
        await AutoblogWrite.updatePostSchedule(ctx, {
            postId: args.postId,
            scheduledFor: args.newScheduledFor,
            scheduledFunctionId,
            status: "scheduled",
        });

        return { success: true, scheduledFunctionId };
    },
});

export const cancelScheduledPost = mutation({
    args: {
        postId: v.id("autoblogPosts"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);

        // Get the post
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        // Validate user owns the client
        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // Check if post is scheduled
        if (post.status !== "scheduled") {
            throw new Error("Post is not scheduled");
        }

        // Cancel the scheduled function
        if (post.scheduledFunctionId) {
            try {
                await ctx.scheduler.cancel(post.scheduledFunctionId);
            } catch {
                // Ignore errors if the function was already executed or cancelled
            }
        }

        // Update the post status back to draft
        await AutoblogWrite.updatePostSchedule(ctx, {
            postId: args.postId,
            scheduledFor: null,
            scheduledFunctionId: null,
            status: "draft",
        });

        return { success: true };
    },
});

export const publishNow = mutation({
    args: {
        postId: v.id("autoblogPosts"),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);

        // Get the post
        const post = await AutoblogRead.getPostById(ctx, args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        // Validate user owns the client
        const client = await ClientsRead.getById(ctx, post.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // Check if post can be published
        if (post.status === "published") {
            throw new Error("Post is already published");
        }

        if (post.status === "publishing") {
            throw new Error("Post is currently publishing");
        }

        // Cancel any existing scheduled function
        if (post.scheduledFunctionId) {
            try {
                await ctx.scheduler.cancel(post.scheduledFunctionId);
            } catch {
                // Ignore errors
            }
        }

        // Schedule immediate publish (1 second from now to ensure it runs as an action)
        const scheduledFunctionId = await ctx.scheduler.runAt(
            Date.now() + 1000,
            internal.autoblogPublish.publishPost,
            { postId: args.postId },
        );

        // Update the post
        await AutoblogWrite.updatePostSchedule(ctx, {
            postId: args.postId,
            scheduledFor: Date.now(),
            scheduledFunctionId,
            status: "scheduled",
        });

        return { success: true };
    },
});
