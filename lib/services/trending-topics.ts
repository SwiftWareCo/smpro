import { GoogleGenAI } from "@google/genai";

export interface TrendingTopic {
    topic: string;
    relevance: string;
    timeliness: string;
    searchIntent: string;
}

export interface TrendingTopicsResult {
    success: boolean;
    topics?: TrendingTopic[];
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

const TRENDING_TOPICS_PROMPT = `You are a content marketing expert with deep knowledge of current trends, seasonal patterns, and search behavior.

Today's date is: {currentDate}

Given:
- Industry: {industry}
- Target Keywords: {keywords}
- Business Location: {location}

Generate {count} trending or timely blog topic ideas that would be relevant RIGHT NOW for this business.

Consider:
1. **Seasonal relevance** - What's happening this month/season that relates to the industry?
2. **Current events** - Any recent news, regulations, or industry developments?
3. **Upcoming events** - Holidays, awareness months, industry events coming soon
4. **Evergreen with timely angles** - Classic topics with a current twist
5. **Search trends** - What are people likely searching for right now in this industry?

For each topic, explain:
- Why it's timely (what makes it relevant NOW)
- The search intent (what problem does the reader want to solve)

Return ONLY valid JSON:
{
  "topics": [
    {
      "topic": "Blog topic title with timely angle",
      "relevance": "Why this is relevant to the business",
      "timeliness": "Why this topic is timely RIGHT NOW (mention specific date/season/event)",
      "searchIntent": "What the reader is trying to accomplish"
    }
  ]
}`;

export async function getTrendingTopics(
    industry: string,
    keywords: string[],
    location?: string | null,
    count: number = 5,
): Promise<TrendingTopicsResult> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: "GEMINI_API_KEY not configured",
            };
        }

        const genAI = new GoogleGenAI({ apiKey });

        const currentDate = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const prompt = TRENDING_TOPICS_PROMPT.replace(
            "{currentDate}",
            currentDate,
        )
            .replace("{industry}", industry || "general business")
            .replace(
                "{keywords}",
                keywords.length > 0 ? keywords.join(", ") : "none specified",
            )
            .replace("{location}", location || "not specified")
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

        let jsonStr = jsonMatch[0];
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");
        jsonStr = jsonStr.replace(/\/\/[^\n]*/g, "");

        let parsed: { topics?: unknown[] };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            jsonStr = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
            parsed = JSON.parse(jsonStr);
        }

        if (!Array.isArray(parsed.topics)) {
            return {
                success: false,
                error: "Invalid response format - missing topics array",
            };
        }

        const topics: TrendingTopic[] = parsed.topics
            .filter(
                (t: unknown): t is Record<string, unknown> =>
                    typeof t === "object" && t !== null,
            )
            .map((t: Record<string, unknown>) => ({
                topic: String(t.topic || ""),
                relevance: String(t.relevance || ""),
                timeliness: String(t.timeliness || ""),
                searchIntent: String(t.searchIntent || ""),
            }))
            .filter((t: TrendingTopic) => t.topic.length > 0)
            .slice(0, count);

        return {
            success: true,
            topics,
            usage: {
                promptTokens:
                    response.usageMetadata?.promptTokenCount ?? 0,
                completionTokens:
                    response.usageMetadata?.candidatesTokenCount ?? 0,
            },
        };
    } catch (error) {
        console.error("Trending topics error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get trending topics",
        };
    }
}

export function getCurrentSeasonalContext(): {
    season: string;
    month: string;
    quarter: string;
    upcomingHolidays: string[];
} {
    const now = new Date();
    const month = now.getMonth();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const seasons = [
        "Winter",
        "Winter",
        "Spring",
        "Spring",
        "Spring",
        "Summer",
        "Summer",
        "Summer",
        "Fall",
        "Fall",
        "Fall",
        "Winter",
    ];

    const quarters = [
        "Q1",
        "Q1",
        "Q1",
        "Q2",
        "Q2",
        "Q2",
        "Q3",
        "Q3",
        "Q3",
        "Q4",
        "Q4",
        "Q4",
    ];

    const holidaysByMonth: Record<number, string[]> = {
        0: ["New Year", "Martin Luther King Jr. Day"],
        1: ["Valentine's Day", "Presidents' Day"],
        2: ["St. Patrick's Day", "Spring Equinox"],
        3: ["Easter", "Earth Day"],
        4: ["Mother's Day", "Memorial Day"],
        5: ["Father's Day", "Summer Solstice"],
        6: ["Independence Day"],
        7: ["Back to School"],
        8: ["Labor Day", "Fall Equinox"],
        9: ["Halloween"],
        10: ["Veterans Day", "Thanksgiving", "Black Friday"],
        11: ["Christmas", "Hanukkah", "New Year's Eve"],
    };

    const currentHolidays = holidaysByMonth[month] || [];
    const nextMonth = (month + 1) % 12;
    const upcomingHolidays = [
        ...currentHolidays,
        ...(holidaysByMonth[nextMonth] || []),
    ];

    return {
        season: seasons[month],
        month: monthNames[month],
        quarter: quarters[month],
        upcomingHolidays,
    };
}
