import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./_lib/auth";
import * as ClientsRead from "./db/clients/read";
import * as SeoRead from "./db/seo/read";
import * as SeoWrite from "./db/seo/write";

export const getByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return null;
        }
        return SeoRead.getByClient(ctx, args.clientId);
    },
});

export const upsert = mutation({
    args: {
        clientId: v.id("clients"),
        websiteUrl: v.optional(v.union(v.string(), v.null())),
        targetKeywords: v.optional(v.array(v.string())),
        targetLocations: v.optional(v.array(v.string())),
        metaTitle: v.optional(v.union(v.string(), v.null())),
        metaDescription: v.optional(v.union(v.string(), v.null())),
        industry: v.optional(v.union(v.string(), v.null())),
        analyzedAt: v.optional(v.union(v.number(), v.null())),
        analysisProvider: v.optional(v.union(v.string(), v.null())),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Client not found");
        }
        return SeoWrite.upsert(ctx, {
            clientId: args.clientId,
            websiteUrl: args.websiteUrl ?? null,
            targetKeywords: args.targetKeywords ?? null,
            targetLocations: args.targetLocations ?? null,
            metaTitle: args.metaTitle ?? null,
            metaDescription: args.metaDescription ?? null,
            industry: args.industry ?? null,
            analyzedAt: args.analyzedAt ?? null,
            analysisProvider: args.analysisProvider ?? null,
        });
    },
});
