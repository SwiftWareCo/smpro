import { GoogleGenAI } from "@google/genai";
import {
    getComponentsForLayout,
    generateFrontmatter,
    calculateReadingTime,
    generateSlug,
    type MDXComponentName,
    LAYOUT_COMPONENTS,
} from "../mdx/components";
import { type UnsplashImage, getAttributionMarkdown } from "./unsplash";

export interface PostGenerationInput {
    idea: {
        title: string;
        description: string;
        keywords: string[];
        targetWordCount: number;
    };
    layout: "callout" | "story" | "guide";
    clientContext: {
        businessName: string;
        industry: string;
        websiteUrl?: string | null;
        targetKeywords: string[];
    };
    featuredImage?: UnsplashImage | null;
    author?: string;
}

export interface GeneratedPost {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    metadata: {
        featuredImage: string | null;
        author: string | null;
        tags: string[];
        readingTime: number;
    };
    generation: {
        model: string;
        provider: string;
        promptTokens: number | null;
        cost: number | null;
        generatedAt: number;
    };
}

export interface PostGenerationResult {
    success: boolean;
    post?: GeneratedPost;
    error?: string;
}

function getLayoutInstructions(layout: "callout" | "story" | "guide"): string {
    const components = LAYOUT_COMPONENTS[layout];

    switch (layout) {
        case "callout":
            return `
## Layout Style: Callout-Heavy
Create an engaging article that uses visual callouts and statistics to highlight key information.

Structure:
1. Engaging introduction that hooks the reader
2. Use Callout components for important tips, warnings, or key takeaways
3. Include StatCard components for impressive statistics or data points
4. Use ImageWithCaption for relevant visuals
5. Include a Chart if data visualization would enhance understanding
6. Strong conclusion with call-to-action

You MUST use these components: ${components.join(", ")}
Use at least 2-3 Callouts and 1-2 StatCards throughout the article.`;

        case "story":
            return `
## Layout Style: Story-Driven
Create a narrative-style article that connects with readers through storytelling and quotes.

Structure:
1. Open with a relatable scenario or question
2. Use Quote components for customer testimonials or expert opinions
3. Weave in personal stories or case studies
4. Use ImageWithCaption for emotional/visual impact
5. Include occasional Callouts for key takeaways
6. End with an inspiring conclusion

You MUST use these components: ${components.join(", ")}
Use at least 2 Quotes and create an engaging narrative flow.`;

        case "guide":
            return `
## Layout Style: Step-by-Step Guide
Create a practical, actionable how-to guide that readers can follow.

Structure:
1. Brief introduction explaining what readers will learn
2. Use StepGuide component for the main tutorial steps
3. Add Callout components for tips, warnings, or important notes
4. Include StatCard for relevant statistics or benchmarks
5. Use ImageWithCaption for visual instructions
6. Optional Chart for comparison data
7. Summary and next steps

You MUST use these components: ${components.join(", ")}
The StepGuide should be the main focus with 4-8 clear steps.`;
    }
}

const POST_GENERATION_PROMPT = `You are an expert content writer creating a blog post in MDX format. MDX allows you to use React components within markdown.

## Business Context
- Business Name: {businessName}
- Industry: {industry}
- Website: {websiteUrl}
- Target Keywords: {targetKeywords}

## Blog Post Topic
- Title: {title}
- Description: {description}
- Target Keywords: {postKeywords}
- Target Word Count: {targetWordCount} words

{layoutInstructions}

## Available MDX Components

{componentDocs}

## Writing Guidelines

1. **SEO Optimization**: Naturally incorporate the target keywords throughout the article
2. **Engaging Content**: Write for humans first, search engines second
3. **Expertise**: Demonstrate authority in the {industry} industry
4. **Actionable**: Provide practical value readers can apply
5. **Professional Tone**: Informative yet approachable

## Image Placeholder
{imageInstructions}

## Output Format

Return ONLY the MDX content (no frontmatter - that will be added separately).
Start directly with the content.

IMPORTANT:
- Use proper MDX component syntax as shown in examples
- Do NOT use markdown image syntax - use ImageWithCaption component instead
- Ensure all component props are properly formatted
- Write approximately {targetWordCount} words of content`;

export async function generatePost(
    input: PostGenerationInput,
): Promise<PostGenerationResult> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: "GEMINI_API_KEY not configured",
            };
        }

        const genAI = new GoogleGenAI({ apiKey });

        const layoutInstructions = getLayoutInstructions(input.layout);
        const componentDocs = getComponentsForLayout(input.layout);

        let imageInstructions =
            "No featured image provided. You may reference generic images using ImageWithCaption with placeholder src.";
        if (input.featuredImage) {
            imageInstructions = `A featured image is available:
- URL: ${input.featuredImage.regularUrl}
- Alt: ${input.featuredImage.altDescription || input.idea.title}
- Credit: ${getAttributionMarkdown(input.featuredImage)}

Include this image near the top of the article using ImageWithCaption.`;
        }

        const prompt = POST_GENERATION_PROMPT.replace(
            "{businessName}",
            input.clientContext.businessName,
        )
            .replace("{industry}", input.clientContext.industry)
            .replace(
                "{websiteUrl}",
                input.clientContext.websiteUrl || "Not provided",
            )
            .replace(
                "{targetKeywords}",
                input.clientContext.targetKeywords.join(", "),
            )
            .replace("{title}", input.idea.title)
            .replace("{description}", input.idea.description)
            .replace("{postKeywords}", input.idea.keywords.join(", "))
            .replace(/{targetWordCount}/g, String(input.idea.targetWordCount))
            .replace("{layoutInstructions}", layoutInstructions)
            .replace("{componentDocs}", componentDocs)
            .replace("{imageInstructions}", imageInstructions);

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const content = response.text;

        if (!content) {
            return {
                success: false,
                error: "No content generated",
            };
        }

        // Clean up the content - remove any accidental code block wrapping
        let cleanContent = content.trim();
        if (cleanContent.startsWith("```mdx")) {
            cleanContent = cleanContent.slice(6);
        } else if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith("```")) {
            cleanContent = cleanContent.slice(0, -3);
        }
        cleanContent = cleanContent.trim();

        // Generate metadata
        const slug = generateSlug(input.idea.title);
        const readingTime = calculateReadingTime(cleanContent);

        // Generate excerpt (first 150 chars of content, cleaned)
        const excerptText = cleanContent
            .replace(/<[^>]*>/g, "") // Remove JSX/HTML tags
            .replace(/\{[^}]*\}/g, "") // Remove JSX expressions
            .replace(/[#*`]/g, "") // Remove markdown formatting
            .trim()
            .slice(0, 150);
        const excerpt = excerptText + (excerptText.length >= 150 ? "..." : "");

        // Build the full MDX with frontmatter
        const frontmatter = generateFrontmatter({
            title: input.idea.title,
            slug,
            excerpt,
            author: input.author || input.clientContext.businessName,
            publishedAt: new Date().toISOString(),
            tags: input.idea.keywords.slice(0, 5),
            featuredImage: input.featuredImage?.regularUrl,
            readingTime,
        });

        const fullContent = `${frontmatter}\n\n${cleanContent}`;

        const post: GeneratedPost = {
            title: input.idea.title,
            slug,
            content: fullContent,
            excerpt,
            metadata: {
                featuredImage: input.featuredImage?.regularUrl ?? null,
                author: input.author || input.clientContext.businessName,
                tags: input.idea.keywords.slice(0, 5),
                readingTime,
            },
            generation: {
                model: "gemini-2.5-flash",
                provider: "google",
                promptTokens: null, // Gemini doesn't easily expose this
                cost: null,
                generatedAt: Date.now(),
            },
        };

        return {
            success: true,
            post,
        };
    } catch (error) {
        console.error("Post generation error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Post generation failed",
        };
    }
}
