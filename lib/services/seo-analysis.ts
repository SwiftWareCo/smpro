import 'server-only';

import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env.mjs';
import {
  INDUSTRY_OPTIONS,
  type IndustryType,
  MAX_CONTENT_LENGTH,
  MAX_AGGREGATE_CHARS,
  MIN_CONTENT_LENGTH,
} from '@/lib/constants/seo';

// Re-export for convenience
export { INDUSTRY_OPTIONS, type IndustryType } from '@/lib/constants/seo';

export interface PagesSummary {
  totalAnalyzed: number;
  keyPages: string[];
}

export interface SeoAnalysisResult {
  success: boolean;
  data?: {
    keywords: string[];
    location: string | null;
    industry: IndustryType;
    metaTitle: string | null;
    metaDescription: string | null;
    pagesSummary?: PagesSummary;
  };
  error?: string;
}

const SINGLE_PAGE_PROMPT = `You are an SEO expert analyzing website content. Extract the following information and return ONLY valid JSON:

{
  "keywords": ["array", "of", "relevant", "seo", "keywords"],
  "location": "city, state or null if not found",
  "industry": "one of: ${INDUSTRY_OPTIONS.join(', ')}",
  "metaTitle": "suggested SEO title (max 60 chars)",
  "metaDescription": "suggested meta description (max 160 chars)"
}

Rules:
- Extract 5-10 relevant keywords that describe the business
- Location should be the primary service area or business location
- Industry MUST be one of the predefined options, use "other" if unclear
- Meta title should include business name and primary service
- Meta description should be compelling and include location if relevant

Website content to analyze:
`;

const MULTI_PAGE_PROMPT = `You are an SEO expert analyzing website content from MULTIPLE pages of a website.
Each page is separated by "--- PAGE: [URL] ---".

Extract comprehensive SEO information considering ALL pages and return ONLY valid JSON:

{
  "keywords": ["array", "of", "relevant", "seo", "keywords"],
  "location": "city, state or null if not found",
  "industry": "one of: ${INDUSTRY_OPTIONS.join(', ')}",
  "metaTitle": "suggested SEO title (max 60 chars)",
  "metaDescription": "suggested meta description (max 160 chars)",
  "keyPages": ["list", "of", "most", "important", "page", "paths"]
}

Rules:
- Extract 10-20 relevant keywords from across ALL pages
- Consider keywords from services, about, and product pages as highest priority
- Location should be the primary service area or business location (often found on contact/about pages)
- Industry MUST be one of the predefined options, use "other" if unclear
- Meta title should capture the core business identity
- Meta description should summarize the business holistically
- keyPages should list 3-5 most important page paths (e.g., "/services", "/about")

Website content to analyze:
`;

/**
 * Analyze website content using Gemini AI to extract SEO data.
 *
 * @param markdown - The website content in markdown format
 * @param isMultiPage - Whether this is aggregated content from multiple pages
 * @param pagesAnalyzed - Number of pages analyzed (for multi-page only)
 */
export async function analyzeWebsiteContent(
  markdown: string,
  isMultiPage: boolean = false,
  pagesAnalyzed: number = 1
): Promise<SeoAnalysisResult> {
  if (!markdown || markdown.trim().length < MIN_CONTENT_LENGTH) {
    return {
      success: false,
      error: 'Content too short to analyze',
    };
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    // Use appropriate prompt and content limit based on mode
    const prompt = isMultiPage ? MULTI_PAGE_PROMPT : SINGLE_PAGE_PROMPT;
    const maxLength = isMultiPage ? MAX_AGGREGATE_CHARS : MAX_CONTENT_LENGTH;
    const maxKeywords = isMultiPage ? 20 : 10;

    // Truncate content to stay within limits
    const truncatedContent = markdown.slice(0, maxLength);

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + truncatedContent,
    });

    const text = response.text;

    if (!text) {
      return {
        success: false,
        error: 'No response from AI',
      };
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse AI response as JSON',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter((k: unknown): k is string => typeof k === 'string')
          .slice(0, maxKeywords)
      : [];

    const industry: IndustryType = INDUSTRY_OPTIONS.includes(parsed.industry)
      ? parsed.industry
      : 'other';

    // Build result
    const result: SeoAnalysisResult = {
      success: true,
      data: {
        keywords,
        location: typeof parsed.location === 'string' ? parsed.location : null,
        industry,
        metaTitle:
          typeof parsed.metaTitle === 'string'
            ? parsed.metaTitle.slice(0, 60)
            : null,
        metaDescription:
          typeof parsed.metaDescription === 'string'
            ? parsed.metaDescription.slice(0, 160)
            : null,
      },
    };

    // Add pages summary for multi-page analysis
    if (isMultiPage && result.data) {
      const keyPages = Array.isArray(parsed.keyPages)
        ? parsed.keyPages
            .filter((p: unknown): p is string => typeof p === 'string')
            .slice(0, 5)
        : [];

      result.data.pagesSummary = {
        totalAnalyzed: pagesAnalyzed,
        keyPages,
      };
    }

    return result;
  } catch (error) {
    console.error('SEO analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI analysis failed',
    };
  }
}
