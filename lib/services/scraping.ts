import type { PageContent } from "./content-aggregator";

export type ScrapingProvider = "jina" | "firecrawl";

export interface ScrapeResult {
    success: boolean;
    content?: string;
    error?: string;
    provider: ScrapingProvider;
}

export interface BatchScrapeResult {
    pages: PageContent[];
    errors: Array<{ url: string; error: string }>;
    totalScraped: number;
    totalFailed: number;
}

export interface CrawlResult {
    success: boolean;
    pages: PageContent[];
    error?: string;
}

/**
 * Scrape a website URL and return clean markdown content.
 * Supports Jina Reader (default) and Firecrawl as providers.
 */
export async function scrapeWebsite(
    url: string,
    provider: ScrapingProvider = "jina",
): Promise<ScrapeResult> {
    // Validate URL
    try {
        new URL(url);
    } catch {
        return { success: false, error: "Invalid URL format", provider };
    }

    if (provider === "firecrawl") {
        return scrapeWithFirecrawl(url);
    }

    return scrapeWithJina(url);
}

/**
 * Jina Reader - Zero setup, just prepend URL
 * Free tier: 20 req/min without API key, higher with API key
 */
async function scrapeWithJina(url: string): Promise<ScrapeResult> {
    try {
        const jinaUrl = `https://r.jina.ai/${url}`;

        const headers: Record<string, string> = {
            Accept: "text/plain",
        };

        // Add API key if available for higher rate limits
        if (process.env.JINA_API_KEY) {
            headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
        }

        const response = await fetch(jinaUrl, { headers });

        if (!response.ok) {
            return {
                success: false,
                error: `Jina Reader failed: ${response.status} ${response.statusText}`,
                provider: "jina",
            };
        }

        const content = await response.text();

        if (!content || content.trim().length === 0) {
            return {
                success: false,
                error: "No content extracted from website",
                provider: "jina",
            };
        }

        return { success: true, content, provider: "jina" };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown scraping error",
            provider: "jina",
        };
    }
}

/**
 * Firecrawl - Full-featured scraping with JavaScript rendering
 * Requires API key in env
 */
async function scrapeWithFirecrawl(url: string): Promise<ScrapeResult> {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: "FIRECRAWL_API_KEY not configured",
            provider: "firecrawl",
        };
    }

    try {
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                url,
                formats: ["markdown"],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `Firecrawl failed: ${response.status} - ${
                    errorData.message || response.statusText
                }`,
                provider: "firecrawl",
            };
        }

        const data = await response.json();

        if (!data.success || !data.data?.markdown) {
            return {
                success: false,
                error: "No content extracted from website",
                provider: "firecrawl",
            };
        }

        return {
            success: true,
            content: data.data.markdown,
            provider: "firecrawl",
        };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown scraping error",
            provider: "firecrawl",
        };
    }
}

// Rate limiting delay between Jina requests (milliseconds)
// Without API key: ~3s delay for 20 req/min
// With API key: no delay needed
const JINA_RATE_LIMIT_DELAY = 3100;

/**
 * Batch scrape multiple URLs using Jina Reader with rate limiting.
 * URLs should be sorted by priority (important pages first).
 *
 * @param urls - Array of URLs to scrape
 * @param onProgress - Optional callback for progress updates
 * @returns BatchScrapeResult with pages and errors
 */
export async function batchScrapeWithJina(
    urls: string[],
    onProgress?: (completed: number, total: number, currentUrl: string) => void,
): Promise<BatchScrapeResult> {
    const pages: PageContent[] = [];
    const errors: Array<{ url: string; error: string }> = [];
    const hasApiKey = Boolean(process.env.JINA_API_KEY);

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        onProgress?.(i + 1, urls.length, url);

        const result = await scrapeWithJina(url);

        if (result.success && result.content) {
            pages.push({ url, content: result.content });
        } else {
            errors.push({ url, error: result.error || "Unknown error" });
        }

        // Rate limiting for free tier (skip if we have API key or it's the last URL)
        if (!hasApiKey && i < urls.length - 1) {
            await new Promise((resolve) =>
                setTimeout(resolve, JINA_RATE_LIMIT_DELAY),
            );
        }
    }

    return {
        pages,
        errors,
        totalScraped: pages.length,
        totalFailed: errors.length,
    };
}

/**
 * Use Firecrawl's native multi-page crawl API.
 * Starts a crawl job and polls until completion.
 *
 * @param rootUrl - The root URL to crawl from
 * @param options - Crawl options
 * @returns CrawlResult with all pages
 */
export async function crawlWithFirecrawl(
    rootUrl: string,
    options: {
        maxPages?: number;
        onProgress?: (status: string, pagesFound?: number) => void;
    } = {},
): Promise<CrawlResult> {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            pages: [],
            error: "FIRECRAWL_API_KEY not configured",
        };
    }

    try {
        // Start crawl job
        const startResponse = await fetch(
            "https://api.firecrawl.dev/v1/crawl",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    url: rootUrl,
                    limit: options.maxPages || 50,
                    scrapeOptions: {
                        formats: ["markdown"],
                    },
                }),
            },
        );

        if (!startResponse.ok) {
            const errorData = await startResponse.json().catch(() => ({}));
            return {
                success: false,
                pages: [],
                error: `Failed to start crawl: ${errorData.message || startResponse.statusText}`,
            };
        }

        const startData = await startResponse.json();
        const crawlId = startData.id;

        if (!crawlId) {
            return {
                success: false,
                pages: [],
                error: "No crawl ID returned from Firecrawl",
            };
        }

        // Poll for completion
        const maxPolls = 300; // 10 minutes max (2s intervals)
        for (let poll = 0; poll < maxPolls; poll++) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const statusResponse = await fetch(
                `https://api.firecrawl.dev/v1/crawl/${crawlId}`,
                {
                    headers: { Authorization: `Bearer ${apiKey}` },
                },
            );

            if (!statusResponse.ok) {
                continue; // Retry on network errors
            }

            const statusData = await statusResponse.json();
            options.onProgress?.(statusData.status, statusData.data?.length);

            if (statusData.status === "completed") {
                const pages: PageContent[] = (statusData.data || [])
                    .filter((page: { markdown?: string }) => page.markdown)
                    .map((page: { sourceURL?: string; markdown: string }) => ({
                        url: page.sourceURL || rootUrl,
                        content: page.markdown,
                    }));

                return { success: true, pages };
            }

            if (statusData.status === "failed") {
                return {
                    success: false,
                    pages: [],
                    error: statusData.error || "Crawl failed",
                };
            }
        }

        return {
            success: false,
            pages: [],
            error: "Crawl timed out after 10 minutes",
        };
    } catch (error) {
        return {
            success: false,
            pages: [],
            error:
                error instanceof Error ? error.message : "Unknown crawl error",
        };
    }
}
