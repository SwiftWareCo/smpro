import 'server-only';

import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env.mjs';
import {
  INDUSTRY_OPTIONS,
  type IndustryType,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
} from '@/lib/constants/seo';

// Re-export for convenience
export { INDUSTRY_OPTIONS, type IndustryType } from '@/lib/constants/seo';

export interface SeoAnalysisResult {
  success: boolean;
  data?: {
    keywords: string[];
    location: string | null;
    industry: IndustryType;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  error?: string;
}

const ANALYSIS_PROMPT = `You are an SEO expert analyzing website content. Extract the following information and return ONLY valid JSON:

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

/**
 * Analyze website content using Gemini AI to extract SEO data.
 */
export async function analyzeWebsiteContent(
  markdown: string
): Promise<SeoAnalysisResult> {
  if (!markdown || markdown.trim().length < MIN_CONTENT_LENGTH) {
    return {
      success: false,
      error: 'Content too short to analyze',
    };
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    // Truncate content to stay within Gemini limits
    const truncatedContent = markdown.slice(0, MAX_CONTENT_LENGTH);

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: ANALYSIS_PROMPT + truncatedContent,
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
          .slice(0, 10)
      : [];

    const industry: IndustryType = INDUSTRY_OPTIONS.includes(parsed.industry)
      ? parsed.industry
      : 'other';

    return {
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
  } catch (error) {
    console.error('SEO analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI analysis failed',
    };
  }
}
