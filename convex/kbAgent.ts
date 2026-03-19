"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { components } from "./_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { rag } from "./_lib/rag";

const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const kbAgent = new Agent(components.agent, {
    name: "KB Assistant",
    languageModel: googleAI("gemini-3.1-flash-lite-preview"),
    instructions: `You are a helpful knowledge base assistant. You answer questions based ONLY on the documents uploaded to this knowledge base.

Rules:
1. ALWAYS use the searchKnowledgeBase tool to find relevant information before answering.
2. Only answer based on the retrieved context. Do not make up information.
3. If the search returns no relevant results, say "I don't have that information in the knowledge base. Try uploading relevant documents first."
4. When answering, cite the source document titles when available.
5. Be concise and direct.
6. If the question is ambiguous, ask for clarification.`,
    maxSteps: 4,
});

export const respond = internalAction({
    args: {
        clientId: v.string(),
        threadId: v.string(),
        prompt: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const searchKnowledgeBase = createTool({
            description:
                "Search the knowledge base for documents relevant to the user's question. Always use this before answering.",
            inputSchema: z.object({
                query: z
                    .string()
                    .describe(
                        "The search query based on the user's question",
                    ),
            }),
            execute: async (toolCtx, { query }) => {
                const results = await rag.search(toolCtx, {
                    namespace: args.clientId,
                    query,
                    limit: 8,
                    searchType: "hybrid",
                    chunkContext: { before: 1, after: 1 },
                });

                return {
                    text: results.text,
                    entries: results.entries.map((e) => ({
                        title: e.title,
                        key: e.key,
                    })),
                };
            },
        });

        await kbAgent.streamText(
            ctx,
            { threadId: args.threadId, userId: args.userId },
            { prompt: args.prompt, tools: { searchKnowledgeBase } },
            { saveStreamDeltas: true },
        );
    },
});
