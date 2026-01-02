import { env } from '@/lib/env.mjs';

export type ScrapingProvider = 'jina' | 'firecrawl';

interface ScrapeResult {
  success: boolean;
  content?: string;
  error?: string;
  provider: ScrapingProvider;
}

/**
 * Scrape a website URL and return clean markdown content.
 * Supports Jina Reader (default) and Firecrawl as providers.
 */
export async function scrapeWebsite(
  url: string,
  provider: ScrapingProvider = 'jina'
): Promise<ScrapeResult> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    return { success: false, error: 'Invalid URL format', provider };
  }

  if (provider === 'firecrawl') {
    return scrapeWithFirecrawl(url);
  }

  return scrapeWithJina(url);
}

/**
 * Jina Reader - Zero setup, just prepend URL
 * Free tier: 20 req/min without API key
 */
async function scrapeWithJina(url: string): Promise<ScrapeResult> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;

    const response = await fetch(jinaUrl, {
      headers: {
        Accept: 'text/plain',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Jina Reader failed: ${response.status} ${response.statusText}`,
        provider: 'jina',
      };
    }

    const content = await response.text();

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'No content extracted from website',
        provider: 'jina',
      };
    }

    return { success: true, content, provider: 'jina' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown scraping error',
      provider: 'jina',
    };
  }
}

/**
 * Firecrawl - Full-featured scraping with JavaScript rendering
 * Requires API key in env
 */
async function scrapeWithFirecrawl(url: string): Promise<ScrapeResult> {
  const apiKey = env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'FIRECRAWL_API_KEY not configured',
      provider: 'firecrawl',
    };
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Firecrawl failed: ${response.status} - ${
          errorData.message || response.statusText
        }`,
        provider: 'firecrawl',
      };
    }

    const data = await response.json();

    if (!data.success || !data.data?.markdown) {
      return {
        success: false,
        error: 'No content extracted from website',
        provider: 'firecrawl',
      };
    }

    return {
      success: true,
      content: data.data.markdown,
      provider: 'firecrawl',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown scraping error',
      provider: 'firecrawl',
    };
  }
}
