"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
    generateTopicIdeas,
    type GeneratedTopic,
} from "../lib/services/topic-generation";
import { getTrendingTopics } from "../lib/services/trending-topics";

export const generateTopics = action({
    args: {
        clientId: v.id("clients"),
        count: v.optional(v.number()),
        includeTrending: v.optional(v.boolean()),
        topicSeeds: v.optional(v.array(v.string())),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{
        success: boolean;
        generatedCount: number;
        error?: string;
    }> => {
        const count = args.count ?? 5;
        const includeTrending = args.includeTrending ?? true;

        // Get client data
        const client = await ctx.runQuery(api.clients.get, {
            clientId: args.clientId,
        });
        if (!client) {
            return {
                success: false,
                generatedCount: 0,
                error: "Client not found",
            };
        }

        // Get autoblog settings
        const settings = await ctx.runQuery(api.autoblog.getSettings, {
            clientId: args.clientId,
        });
        if (!settings) {
            return {
                success: false,
                generatedCount: 0,
                error: "Autoblog not configured",
            };
        }

        // Get SEO settings for website URL and keywords
        const seoSettings = await ctx.runQuery(api.seo.getByClient, {
            clientId: args.clientId,
        });

        // Validate that we have meaningful context for topic generation
        const hasWebsite = !!seoSettings?.websiteUrl;
        const hasIndustry =
            !!seoSettings?.industry && seoSettings.industry !== "general";
        const hasKeywords =
            !!seoSettings?.targetKeywords &&
            seoSettings.targetKeywords.length > 0;
        const hasDescription = !!client.description;
        const hasSeeds =
            (args.topicSeeds && args.topicSeeds.length > 0) ||
            (settings.config.topicSeeds &&
                settings.config.topicSeeds.length > 0);

        if (
            !hasWebsite &&
            !hasIndustry &&
            !hasKeywords &&
            !hasDescription &&
            !hasSeeds
        ) {
            return {
                success: false,
                generatedCount: 0,
                error: "Please configure SEO settings (industry, keywords, or website URL) before generating topics. You can also add a client description for better context.",
            };
        }

        // Get existing ideas to avoid duplicates
        const existingIdeas = await ctx.runQuery(api.autoblog.listIdeas, {
            clientId: args.clientId,
        });
        const existingTopics = existingIdeas.map((idea) => idea.title);

        // Combine keywords from SEO settings and topic seeds
        // Prefer seeds passed as args, fall back to stored ones
        const combinedSeeds = [
            ...(args.topicSeeds ?? []),
            ...(settings.config.topicSeeds ?? []),
        ];
        const uniqueSeeds = [...new Set(combinedSeeds)];
        const targetKeywords = [
            ...(seoSettings?.targetKeywords ?? []),
            ...uniqueSeeds,
        ];

        // Generate main topic ideas
        const topicResult = await generateTopicIdeas(
            {
                websiteUrl: seoSettings?.websiteUrl,
                industry: seoSettings?.industry ?? "general",
                targetKeywords,
                topicSeeds: uniqueSeeds.length > 0 ? uniqueSeeds : null,
                existingTopics,
                businessName: client.name,
                businessDescription: client.description ?? null,
            },
            count,
        );

        if (!topicResult.success || !topicResult.topics) {
            return {
                success: false,
                generatedCount: 0,
                error: topicResult.error ?? "Failed to generate topics",
            };
        }

        let allTopics: GeneratedTopic[] = [...topicResult.topics];

        // Optionally get trending topics
        if (includeTrending && allTopics.length < count) {
            const trendingResult = await getTrendingTopics(
                seoSettings?.industry ?? "general",
                targetKeywords,
                seoSettings?.targetLocations?.[0],
                Math.min(3, count - allTopics.length),
            );

            if (trendingResult.success && trendingResult.topics) {
                // Convert trending topics to GeneratedTopic format
                const trendingAsTopics: GeneratedTopic[] =
                    trendingResult.topics.map((t) => ({
                        title: t.topic,
                        description: `${t.relevance} ${t.timeliness}`,
                        keywords: targetKeywords.slice(0, 3),
                        targetWordCount: 1500,
                    }));
                allTopics = [...allTopics, ...trendingAsTopics];

                // Track trending topics usage
                try {
                    if (trendingResult.usage) {
                        await ctx.runMutation(internal.usage.trackUsage, {
                            clientId: args.clientId,
                            service: "trending_topics",
                            promptTokens: trendingResult.usage.promptTokens,
                            completionTokens:
                                trendingResult.usage.completionTokens,
                        });
                    }
                } catch (e) {
                    console.error(
                        "Trending topics usage tracking failed:",
                        e,
                    );
                }
            }
        }

        // Track topic generation usage
        try {
            if (topicResult.usage) {
                await ctx.runMutation(internal.usage.trackUsage, {
                    clientId: args.clientId,
                    service: "topic_generation",
                    promptTokens: topicResult.usage.promptTokens,
                    completionTokens: topicResult.usage.completionTokens,
                });
            }
        } catch (e) {
            console.error("Topic generation usage tracking failed:", e);
        }

        // Save all topics as ideas
        let savedCount = 0;
        for (const topic of allTopics) {
            try {
                await ctx.runMutation(
                    internal.autoblogInternal.createIdea as any,
                    {
                        clientId: args.clientId,
                        title: topic.title,
                        description: topic.description,
                        keywords: topic.keywords,
                        targetWordCount: topic.targetWordCount,
                        generatedBy: "ai",
                    },
                );
                savedCount++;
            } catch (error) {
                console.error("Failed to save topic:", topic.title, error);
            }
        }

        return {
            success: true,
            generatedCount: savedCount,
        };
    },
});
