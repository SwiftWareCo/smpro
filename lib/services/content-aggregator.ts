import { MAX_AGGREGATE_CHARS } from '@/lib/constants/seo';

export interface PageContent {
  url: string;
  content: string;
}

export interface AggregatedContent {
  content: string;
  includedUrls: string[];
  excludedUrls: string[];
  totalChars: number;
}

/**
 * Aggregate markdown content from multiple pages with token budget awareness.
 * Pages should already be sorted by priority (important pages first).
 *
 * @param pages - Array of page content objects, sorted by priority
 * @param maxChars - Maximum characters to include (default: 800k)
 * @returns Aggregated content with metadata about included/excluded pages
 */
export function aggregateContent(
  pages: PageContent[],
  maxChars: number = MAX_AGGREGATE_CHARS
): AggregatedContent {
  let aggregated = '';
  const includedUrls: string[] = [];
  const excludedUrls: string[] = [];

  for (const page of pages) {
    // Skip empty content
    if (!page.content || page.content.trim().length === 0) {
      continue;
    }

    // Format page section with clear separator
    const pageSection = `\n\n--- PAGE: ${page.url} ---\n\n${page.content.trim()}`;

    // Check if adding this page would exceed limit
    if ((aggregated + pageSection).length <= maxChars) {
      aggregated += pageSection;
      includedUrls.push(page.url);
    } else {
      excludedUrls.push(page.url);
    }
  }

  return {
    content: aggregated.trim(),
    includedUrls,
    excludedUrls,
    totalChars: aggregated.length,
  };
}

/**
 * Estimate token count from character count.
 * Rough approximation: 1 token ≈ 4 characters for English text.
 */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

/**
 * Get a summary of the aggregation for logging/display
 */
export function getAggregationSummary(result: AggregatedContent): string {
  const tokens = estimateTokens(result.totalChars);
  return `Aggregated ${result.includedUrls.length} pages (${result.totalChars.toLocaleString()} chars, ~${tokens.toLocaleString()} tokens). ${result.excludedUrls.length} pages excluded due to size limit.`;
}
