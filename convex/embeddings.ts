import { embed } from "ai";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api as generatedApi } from "./_generated/api";
import { requireUserId } from "./_lib/auth";
import * as EmbeddingsRead from "./db/embeddings/read";
import * as EmbeddingsWrite from "./db/embeddings/write";

const embeddingModel = "openai/text-embedding-ada-002";
const api = generatedApi as any;

export const insertMany = mutation({
    args: {
        resourceId: v.string(),
        contents: v.array(v.string()),
        embeddings: v.array(v.array(v.number())),
    },
    handler: async (ctx, args) => {
        return EmbeddingsWrite.insertMany(
            ctx,
            args.resourceId,
            args.contents,
            args.embeddings,
        );
    },
});

export const search = query({
    args: {
        embedding: v.array(v.number()),
        limit: v.optional(v.number()),
        minScore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return EmbeddingsRead.search(ctx, args.embedding, {
            limit: args.limit,
            minScore: args.minScore,
        });
    },
});

export const searchByText = action({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
        minScore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireUserId(ctx);
        const { embedding } = await embed({
            model: embeddingModel,
            value: args.query.replaceAll("\n", " "),
        });
        return ctx.runQuery(api.embeddings.search, {
            embedding,
            limit: args.limit,
            minScore: args.minScore,
        });
    },
});
