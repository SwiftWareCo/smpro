import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { requireClientAccess } from "./_lib/auth";
import { kbAgent } from "./kbAgent";
import * as KBRead from "./db/knowledgeBase/read";
import * as KBWrite from "./db/knowledgeBase/write";

export const startChat = mutation({
    args: {
        clientId: v.id("clients"),
        threadId: v.optional(v.string()),
        prompt: v.string(),
    },
    handler: async (ctx, args) => {
        const client = await requireClientAccess(ctx, args.clientId);
        const userId = client.userId;

        let threadId = args.threadId;
        if (!threadId) {
            const result = await kbAgent.createThread(ctx, { userId });
            threadId = result.threadId;

            // Track this thread in kbThreads
            await KBWrite.createThread(ctx, {
                clientId: args.clientId,
                agentThreadId: threadId,
                title: args.prompt.slice(0, 60),
                userId,
                lastMessageAt: Date.now(),
            });
        } else {
            // Update lastMessageAt on existing thread
            const existing = await KBRead.getThreadByAgentId(ctx, threadId);
            if (existing) {
                await KBWrite.patchThread(ctx, existing._id, {
                    lastMessageAt: Date.now(),
                });
            }
        }

        // Schedule the agent to respond asynchronously
        await ctx.scheduler.runAfter(0, internal.kbAgent.respond, {
            clientId: args.clientId,
            threadId,
            prompt: args.prompt,
            userId,
        });

        return { threadId };
    },
});

export const listThreadMessages = query({
    args: {
        threadId: v.string(),
        paginationOpts: paginationOptsValidator,
        streamArgs: v.optional(vStreamArgs),
    },
    handler: async (ctx, args) => {
        const paginated = await listUIMessages(ctx, components.agent, {
            threadId: args.threadId,
            paginationOpts: args.paginationOpts,
        });
        const streams = await syncStreams(ctx, components.agent, {
            threadId: args.threadId,
            streamArgs: args.streamArgs,
        });
        return { ...paginated, streams };
    },
});

export const listThreads = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const client = await requireClientAccess(ctx, args.clientId);
        return KBRead.listThreadsByClientUser(
            ctx,
            args.clientId,
            client.userId,
            30,
        );
    },
});

export const deleteThread = mutation({
    args: { threadId: v.id("kbThreads") },
    handler: async (ctx, args) => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) throw new Error("Thread not found");
        await requireClientAccess(ctx, thread.clientId);
        await KBWrite.deleteThread(ctx, args.threadId);
        return { success: true };
    },
});
