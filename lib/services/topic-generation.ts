import { GoogleGenAI } from "@google/genai";
import { scrapeWebsite } from "./scraping";

export interface TopicGenerationInput {
    websiteUrl?: string | null;
    websiteContent?: string | null;
    industry: string;
    targetKeywords: string[];
    topicSeeds?: string[] | null;
    existingTopics?: string[];
    businessName?: string | null;
    businessDescription?: string | null;
}

export interface GeneratedTopic {
    title: string;
    description: string;
    keywords: string[];
    targetWordCount: number;
    suggestedPublishDate?: string;
}

export interface TopicGenerationResult {
    success: boolean;
    topics?: GeneratedTopic[];
    error?: string;
    websiteScraped?: boolean;
}

const TOPIC_GENERATION_PROMPT = `You are a content strategist. Generate blog topic ideas SPECIFICALLY relevant to this business and its industry. Do NOT generate generic business advice — every topic must directly relate to what this business does.

Business information:
- Business Name: {businessName}
- Business Description: {businessDescription}
- Industry: {industry}
- Target Keywords: {targetKeywords}
- Topic Seeds (themes they want to cover): {topicSeeds}
- Website Content Summary: {websiteContent}
- Existing Topics to Avoid: {existingTopics}

Generate {count} unique blog topic ideas. Each topic MUST:
1. Be specifically about {industry} — not generic business advice
2. Relate to the products, services, or expertise of {businessName}
3. Target one or more of the provided keywords
4. Answer a question or solve a problem that {businessName}'s customers would have
5. Be search-engine optimized (people would actually search for this)
6. Not duplicate any existing topics

Content types to consider:
- How-to guides and tutorials specific to {industry}
- Industry-specific tips and best practices
- Common questions that {businessName}'s customers ask
- Comparisons and buying guides for {industry} products/services
- Industry trends and news analysis

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "title": "Compelling blog post title with primary keyword",
      "description": "2-3 sentence description of what the post will cover and why it matters to readers",
      "keywords": ["primary keyword", "secondary keyword", "related term"],
      "targetWordCount": 1500
    }
  ]
}

Important:
- Titles should be engaging and include relevant keywords naturally
- Each description should clearly explain the post's value proposition
- Keywords should be realistic search terms (3-5 per topic)
- Word count should be appropriate for the topic depth (1000-2500 words)
- Every topic must be specific to {industry} and {businessName} — reject any generic ideas`;

export async function generateTopicIdeas(
    input: TopicGenerationInput,
    count: number = 5,
): Promise<TopicGenerationResult> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: "GEMINI_API_KEY not configured",
            };
        }

        let websiteContent = input.websiteContent || "";
        let websiteScraped = false;

        if (!websiteContent && input.websiteUrl) {
            const scrapeResult = await scrapeWebsite(input.websiteUrl, "jina");
            if (scrapeResult.success && scrapeResult.content) {
                websiteContent = scrapeResult.content.slice(0, 50000);
                websiteScraped = true;
            }
        }

        const genAI = new GoogleGenAI({ apiKey });

        const prompt = TOPIC_GENERATION_PROMPT.replaceAll(
            "{industry}",
            input.industry || "general business",
        )
            .replaceAll("{businessName}", input.businessName || "the business")
            .replace(
                "{businessDescription}",
                input.businessDescription || "No description provided",
            )
            .replace(
                "{targetKeywords}",
                input.targetKeywords.length > 0
                    ? input.targetKeywords.join(", ")
                    : "none specified",
            )
            .replace(
                "{topicSeeds}",
                input.topicSeeds?.length
                    ? input.topicSeeds.join(", ")
                    : "none specified",
            )
            .replace(
                "{websiteContent}",
                websiteContent
                    ? `\n---\n${websiteContent.slice(0, 30000)}\n---\n`
                    : "No website content available",
            )
            .replace(
                "{existingTopics}",
                input.existingTopics?.length
                    ? input.existingTopics.join(", ")
                    : "none",
            )
            .replace("{count}", String(count));

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const text = response.text;

        if (!text) {
            return {
                success: false,
                error: "No response from AI",
            };
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                success: false,
                error: "Could not parse AI response as JSON",
            };
        }

        // Clean common JSON issues from AI output
        let jsonStr = jsonMatch[0];
        // Remove trailing commas before } or ]
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");
        // Remove JS-style comments
        jsonStr = jsonStr.replace(/\/\/[^\n]*/g, "");

        let parsed: { topics?: unknown[] };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            // If still failing, try more aggressive cleanup
            // Strip control characters that aren't whitespace
            jsonStr = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
            parsed = JSON.parse(jsonStr);
        }

        if (!Array.isArray(parsed.topics)) {
            return {
                success: false,
                error: "Invalid response format - missing topics array",
            };
        }

        const topics: GeneratedTopic[] = parsed.topics
            .filter(
                (t: unknown): t is Record<string, unknown> =>
                    typeof t === "object" && t !== null,
            )
            .map((t: Record<string, unknown>) => ({
                title: String(t.title || "Untitled"),
                description: String(t.description || ""),
                keywords: Array.isArray(t.keywords)
                    ? t.keywords.filter(
                          (k: unknown): k is string => typeof k === "string",
                      )
                    : [],
                targetWordCount:
                    typeof t.targetWordCount === "number"
                        ? t.targetWordCount
                        : 1500,
                suggestedPublishDate:
                    typeof t.suggestedPublishDate === "string"
                        ? t.suggestedPublishDate
                        : undefined,
            }))
            .slice(0, count);

        return {
            success: true,
            topics,
            websiteScraped,
        };
    } catch (error) {
        console.error("Topic generation error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Topic generation failed",
        };
    }
}
