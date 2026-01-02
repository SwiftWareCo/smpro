import { FatalError } from 'workflow';
import { discoverUrls, extractRootUrl } from '@/lib/services/crawling';
import {
  batchScrapeWithJina,
  crawlWithFirecrawl,
  type ScrapingProvider,
} from '@/lib/services/scraping';
import {
  aggregateContent,
  type PageContent,
} from '@/lib/services/content-aggregator';
import {
  analyzeWebsiteContent,
  type SeoAnalysisResult,
} from '@/lib/services/seo-analysis';
import { DEFAULT_MAX_PAGES } from '@/lib/constants/seo';

export interface CrawlParams {
  rootUrl: string;
  clientId: string;
  provider: ScrapingProvider;
  maxPages?: number;
}

export interface CrawlWorkflowResult {
  success: boolean;
  analysis?: SeoAnalysisResult['data'];
  pagesDiscovered: number;
  pagesScraped: number;
  pagesAnalyzed: number;
  error?: string;
}

/**
 * Main SEO crawl workflow - durable multi-step execution.
 * Discovers URLs, scrapes pages, aggregates content, and analyzes with AI.
 */
export async function seoCrawlWorkflow(
  params: CrawlParams
): Promise<CrawlWorkflowResult> {
  'use workflow';

  console.log('[SEO Workflow] Starting with params:', JSON.stringify(params));

  const { rootUrl, provider, maxPages = DEFAULT_MAX_PAGES } = params;

  // Step 1: Discover URLs on the website
  console.log('[SEO Workflow] Step 1: Discovering URLs...');
  const discoveryResult = await discoverUrlsStep(rootUrl, maxPages, provider);

  if (!discoveryResult.success) {
    return {
      success: false,
      pagesDiscovered: 0,
      pagesScraped: 0,
      pagesAnalyzed: 0,
      error: discoveryResult.error,
    };
  }

  // Step 2: Scrape all discovered pages
  console.log(
    '[SEO Workflow] Step 2: Scraping',
    discoveryResult.urls.length,
    'URLs...'
  );
  const scrapeResult = await scrapeUrlsStep(
    discoveryResult.urls,
    provider,
    maxPages
  );

  if (!scrapeResult.success || scrapeResult.pages.length === 0) {
    return {
      success: false,
      pagesDiscovered: discoveryResult.urls.length,
      pagesScraped: 0,
      pagesAnalyzed: 0,
      error: scrapeResult.error || 'No pages could be scraped',
    };
  }

  // Step 3: Aggregate content within token limits
  const aggregated = await aggregateContentStep(scrapeResult.pages);

  // Step 4: Analyze with AI
  const analysis = await analyzeContentStep(
    aggregated.content,
    aggregated.includedUrls.length
  );

  if (!analysis.success) {
    return {
      success: false,
      pagesDiscovered: discoveryResult.urls.length,
      pagesScraped: scrapeResult.pages.length,
      pagesAnalyzed: 0,
      error: analysis.error,
    };
  }

  return {
    success: true,
    analysis: analysis.data,
    pagesDiscovered: discoveryResult.urls.length,
    pagesScraped: scrapeResult.pages.length,
    pagesAnalyzed: aggregated.includedUrls.length,
  };
}

/**
 * Step 1: Discover all URLs on the website
 */
async function discoverUrlsStep(
  rootUrl: string,
  maxPages: number,
  provider: ScrapingProvider
): Promise<{ success: boolean; urls: string[]; error?: string }> {
  'use step';

  console.log(
    '[Step: discoverUrls] Starting for',
    rootUrl,
    'with provider:',
    provider
  );

  try {
    // Normalize to root URL
    const normalizedUrl = extractRootUrl(rootUrl);

    // If using Firecrawl, we skip discovery (Firecrawl does its own crawling)
    if (provider === 'firecrawl') {
      return { success: true, urls: [normalizedUrl] };
    }

    // Use Crawlee for URL discovery
    const result = await discoverUrls({
      rootUrl: normalizedUrl,
      maxPages,
    });

    if (result.urls.length === 0) {
      throw new FatalError('No pages found on website');
    }

    return { success: true, urls: result.urls };
  } catch (error) {
    if (error instanceof FatalError) {
      throw error;
    }
    return {
      success: false,
      urls: [],
      error: error instanceof Error ? error.message : 'URL discovery failed',
    };
  }
}

/**
 * Step 2: Scrape all discovered URLs
 */
async function scrapeUrlsStep(
  urls: string[],
  provider: ScrapingProvider,
  maxPages: number
): Promise<{ success: boolean; pages: PageContent[]; error?: string }> {
  'use step';

  try {
    if (provider === 'firecrawl') {
      // Use Firecrawl's native multi-page crawl
      const result = await crawlWithFirecrawl(urls[0], { maxPages });

      if (!result.success) {
        return { success: false, pages: [], error: result.error };
      }

      return { success: true, pages: result.pages };
    }

    // Use Jina Reader for each URL
    const result = await batchScrapeWithJina(urls);

    // Consider it a failure only if more than 50% of pages failed
    const failureRate =
      result.totalFailed / (result.totalScraped + result.totalFailed);
    if (failureRate > 0.5 && result.totalScraped === 0) {
      return {
        success: false,
        pages: [],
        error: `Scraping failed for ${result.totalFailed} pages`,
      };
    }

    return { success: true, pages: result.pages };
  } catch (error) {
    return {
      success: false,
      pages: [],
      error: error instanceof Error ? error.message : 'Scraping failed',
    };
  }
}

/**
 * Step 3: Aggregate content within token limits
 */
async function aggregateContentStep(pages: PageContent[]) {
  'use step';

  return aggregateContent(pages);
}

/**
 * Step 4: Analyze aggregated content with AI
 */
async function analyzeContentStep(
  content: string,
  pagesAnalyzed: number
): Promise<SeoAnalysisResult> {
  'use step';

  return analyzeWebsiteContent(content, true, pagesAnalyzed);
}
