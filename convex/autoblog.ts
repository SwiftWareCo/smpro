import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./_lib/auth";
import * as ClientsRead from "./db/clients/read";
import * as AutoblogRead from "./db/autoblog/read";
import * as AutoblogWrite from "./db/autoblog/write";

const postingCadenceValidator = v.union(
    v.literal("weekly"),
    v.literal("biweekly"),
    v.literal("monthly"),
);
const layoutValidator = v.union(
    v.literal("callout"),
    v.literal("story"),
    v.literal("guide"),
);

export const getSettings = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
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
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return [];
        }
        return AutoblogRead.listPostsByClient(ctx, args.clientId);
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
                postsPerMonth: v.optional(v.number()),
                topicSeeds: v.optional(v.union(v.array(v.string()), v.null())),
                layout: v.optional(layoutValidator),
                requiresApproval: v.optional(v.boolean()),
                autoPublish: v.optional(v.boolean()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
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
