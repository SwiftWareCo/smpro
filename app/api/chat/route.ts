import {
    convertToModelMessages,
    streamText,
    tool,
    UIMessage,
    stepCountIs,
} from "ai";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import type { FunctionReturnType } from "convex/server";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { userId, getToken } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
    const token = await getToken({ template: "convex" });
    if (!token) return new Response("Unauthorized", { status: 401 });
    const convexOptions = { token };

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: "openai/gpt-4o",
        system: `You are an AI assistant for a social media management app. You help generate content ideas based on the user's past content performance and current trends.

When generating ideas:
1. First search the knowledge base for relevant past content
2. Consider what performed well (high views, engagement)
3. Suggest ideas that build on successful patterns
4. Be specific with titles and hooks

Only respond using information from tool calls. If no relevant data, ask the user to sync their accounts or provide more context.`,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        tools: {
            searchContent: tool({
                description:
                    "Search the user's content library for relevant information. Use this to find what topics, formats, or styles have worked well.",
                inputSchema: z.object({
                    query: z
                        .string()
                        .describe(
                            "Search query - topic, format, or style to look for",
                        ),
                }),
                execute: async ({ query }) => {
                    return fetchAction(
                        api.embeddings.searchByText,
                        { query },
                        convexOptions,
                    );
                },
            }),

            getTopPerformingContent: tool({
                description:
                    "Get the user's top performing content by views or engagement. Use this to understand what content works best.",
                inputSchema: z.object({
                    metric: z
                        .enum(["views", "likes", "comments", "shares"])
                        .describe("Metric to sort by"),
                    platform: z
                        .string()
                        .optional()
                        .describe(
                            "Filter by platform (tiktok, youtube, instagram, facebook)",
                        ),
                    limit: z
                        .number()
                        .default(5)
                        .describe("Number of items to return"),
                }),
                execute: async ({ metric, platform, limit }) => {
                    const results: FunctionReturnType<
                        typeof api.content.topByMetric
                    > = await fetchQuery(
                        api.content.topByMetric,
                        {
                            metric,
                            platform,
                            limit,
                        },
                        convexOptions,
                    );
                    return results.map((item) => ({
                        title: item.title,
                        caption: item.caption,
                        mediaType: item.mediaType,
                        platform: item.platform,
                        views: item.views,
                        likes: item.likes,
                        comments: item.comments,
                        shares: item.shares,
                    }));
                },
            }),

            saveIdea: tool({
                description:
                    "Save a content idea for later. Use this when the user likes an idea or wants to remember it.",
                inputSchema: z.object({
                    title: z.string().describe("The idea title/hook"),
                    description: z
                        .string()
                        .describe("Detailed description of the idea"),
                    confidence: z
                        .number()
                        .min(0)
                        .max(100)
                        .describe("Confidence score 0-100"),
                    basedOnVideoIds: z
                        .array(z.string())
                        .optional()
                        .describe("IDs of videos this idea is based on"),
                }),
                execute: async ({
                    title,
                    description,
                    confidence,
                    basedOnVideoIds,
                }) => {
                    await fetchMutation(
                        api.ideas.save,
                        {
                            title,
                            description,
                            confidence,
                            basedOnVideoIds,
                        },
                        convexOptions,
                    );
                    return `Idea "${title}" saved successfully!`;
                },
            }),

            getContentStats: tool({
                description:
                    "Get aggregate statistics about the user's content library",
                inputSchema: z.object({}),
                execute: async () => {
                    return fetchQuery(
                        api.content.statsByPlatform,
                        {},
                        convexOptions,
                    );
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}
