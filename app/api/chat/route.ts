import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema/videos';
import { savedIdeas } from '@/lib/db/schema/ideas';
import { auth } from '@clerk/nextjs/server';
import { eq, desc, sql } from 'drizzle-orm';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    system: `You are an AI assistant for a social media management app. You help generate content ideas based on the user's past video performance and current trends.

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
          "Search the user's video library and past content for relevant information. Use this to find what topics, formats, or styles have worked well.",
        inputSchema: z.object({
          query: z
            .string()
            .describe('Search query - topic, format, or style to look for'),
        }),
        execute: async ({ query }) => {
          const results = await findRelevantContent(query);
          return results;
        },
      }),

      getTopPerformingVideos: tool({
        description:
          "Get the user's top performing videos by views or engagement. Use this to understand what content works best.",
        inputSchema: z.object({
          metric: z
            .enum(['views', 'likes', 'comments', 'shares'])
            .describe('Metric to sort by'),
          platform: z
            .string()
            .optional()
            .describe(
              'Filter by platform (tiktok, youtube, instagram, facebook)'
            ),
          limit: z.number().default(5).describe('Number of videos to return'),
        }),
        execute: async ({ metric, platform, limit }) => {
          const baseQuery = db
            .select({
              title: videos.title,
              platform: videos.platform,
              views: videos.views,
              likes: videos.likes,
              comments: videos.comments,
              shares: videos.shares,
            })
            .from(videos);

          // Add platform filter if specified and build final query
          const query = platform
            ? baseQuery
                .where(eq(videos.platform, platform))
                .orderBy(desc(videos[metric]))
                .limit(limit)
            : baseQuery.orderBy(desc(videos[metric])).limit(limit);

          return await query;
        },
      }),

      saveIdea: tool({
        description:
          'Save a content idea for later. Use this when the user likes an idea or wants to remember it.',
        inputSchema: z.object({
          title: z.string().describe('The idea title/hook'),
          description: z.string().describe('Detailed description of the idea'),
          confidence: z
            .number()
            .min(0)
            .max(100)
            .describe('Confidence score 0-100'),
          basedOnVideoIds: z
            .array(z.string())
            .optional()
            .describe('IDs of videos this idea is based on'),
        }),
        execute: async ({
          title,
          description,
          confidence,
          basedOnVideoIds,
        }) => {
          await db.insert(savedIdeas).values({
            userId,
            title,
            description,
            confidence,
            basedOnVideoIds,
          });
          return `Idea "${title}" saved successfully!`;
        },
      }),

      getContentStats: tool({
        description:
          "Get aggregate statistics about the user's content library",
        inputSchema: z.object({}),
        execute: async () => {
          const stats = await db
            .select({
              platform: videos.platform,
              totalVideos: sql<number>`count(*)`,
              totalViews: sql<number>`sum(${videos.views})`,
              avgEngagement: sql<number>`avg(${videos.likes} + ${videos.comments} + ${videos.shares})`,
            })
            .from(videos)
            .groupBy(videos.platform);

          return stats;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
