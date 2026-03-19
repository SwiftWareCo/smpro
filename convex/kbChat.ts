import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { requireClientAccess } from "./_lib/auth";
import { kbAgent } from "./kbAgent";

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
