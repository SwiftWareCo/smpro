import { parseStringPromise } from 'xml2js';
import {
  MAX_PAGES_TO_CRAWL,
  DEFAULT_CRAWL_DEPTH,
  PAGE_PRIORITY_PATTERNS,
  SKIP_EXTENSIONS,
} from '@/lib/constants/seo';

export interface DiscoveryOptions {
  rootUrl: string;
  maxPages?: number;
  maxDepth?: number;
  onUrlDiscovered?: (url: string) => void;
}

export interface DiscoveryResult {
  urls: string[];
  rootDomain: string;
  errors: Array<{ url: string; error: string }>;
}

/**
 * Get priority score for a URL based on its path
 * Lower score = higher priority (homepage = 0, blog = 10)
 */
function getUrlPriority(url: string): number {
  try {
    const path = new URL(url).pathname;
    for (const { pattern, priority } of PAGE_PRIORITY_PATTERNS) {
      if (pattern.test(path)) {
        return priority;
      }
    }
  } catch {
    // Invalid URL, lowest priority
  }
  return 100; // Default low priority for unmatched pages
}

/**
 * Sort URLs by priority (important pages first)
 */
function sortByPriority(urls: string[]): string[] {
  return [...urls].sort((a, b) => getUrlPriority(a) - getUrlPriority(b));
}

/**
 * Check if URL should be skipped based on extension
 */
function shouldSkipUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return SKIP_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext));
}

/**
 * Extract root URL from any URL (normalizes to domain root)
 */
export function extractRootUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    // If URL parsing fails, try adding protocol
    if (!url.startsWith('http')) {
      return extractRootUrl(`https://${url}`);
    }
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Fetch and parse a sitemap XML to extract URLs
 */
async function fetchSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    console.log(`[Discovery] Fetching sitemap: ${sitemapUrl}`);
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CMPRO-SEO-Bot/1.0)',
      },
    });

    if (!response.ok) {
      console.log(`[Discovery] Failed to fetch sitemap: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml);
    const urls: string[] = [];

    // Handle standard sitemap <urlset><url><loc>
    if (result.urlset && result.urlset.url) {
      for (const entry of result.urlset.url) {
        if (entry.loc && entry.loc[0]) {
          urls.push(entry.loc[0]);
        }
      }
    }
    // Handle sitemap index <sitemapindex><sitemap><loc>
    else if (result.sitemapindex && result.sitemapindex.sitemap) {
      for (const entry of result.sitemapindex.sitemap) {
        if (entry.loc && entry.loc[0]) {
          // Recursively fetch sub-sitemaps
          const subUrls = await fetchSitemap(entry.loc[0]);
          urls.push(...subUrls);
        }
      }
    }

    return urls;
  } catch (error) {
    console.error(`[Discovery] Error parsing sitemap ${sitemapUrl}:`, error);
    return [];
  }
}

/**
 * Try to find sitemap URL from robots.txt
 */
async function findSitemapsInRobotsTxt(rootUrl: string): Promise<string[]> {
  try {
    const robotsUrl = new URL('/robots.txt', rootUrl).toString();
    console.log(`[Discovery] Fetching robots.txt: ${robotsUrl}`);

    const response = await fetch(robotsUrl);
    if (!response.ok) return [];

    const text = await response.text();
    const sitemaps: string[] = [];

    // Look for "Sitemap: https://..." lines
    const lines = text.split('\n');
    for (const line of lines) {
      const match = line.match(/^Sitemap:\s*(https?:\/\/[^\s]+)/i);
      if (match && match[1]) {
        sitemaps.push(match[1]);
      }
    }

    // If we found sitemaps, fetch them
    const allUrls: string[] = [];
    for (const sitemap of sitemaps) {
      const urls = await fetchSitemap(sitemap);
      allUrls.push(...urls);
    }

    return allUrls;
  } catch (error) {
    console.error('[Discovery] Error parsing robots.txt:', error);
    return [];
  }
}

/**
 * Fallback: Simple HTML scraping of the homepage for internal links
 */
async function scrapeHomepageLinks(
  rootUrl: string,
  rootDomain: string
): Promise<string[]> {
  try {
    console.log(`[Discovery] Scraping homepage for links: ${rootUrl}`);
    const response = await fetch(rootUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CMPRO-SEO-Bot/1.0)',
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const urls = new Set<string>();

    // Simple regex to find hrefs (lightweight, no DOM parser needed)
    // Matches href="..." or href='...'
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      try {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, rootUrl).toString();

        // Only include same-domain links
        if (new URL(absoluteUrl).hostname === rootDomain) {
          // Skip non-html files
          if (!shouldSkipUrl(absoluteUrl) && !absoluteUrl.includes('#')) {
            urls.add(absoluteUrl);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    }

    return Array.from(urls);
  } catch (error) {
    console.error('[Discovery] Error scraping homepage:', error);
    return [];
  }
}

/**
 * Discover all crawlable URLs on a website using lightweight methods
 * 1. Sitemap.xml
 * 2. Robots.txt -> Sitemap
 * 3. Homepage link scraping (Fallback)
 */
export async function discoverUrls(
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const { rootUrl, maxPages = MAX_PAGES_TO_CRAWL, onUrlDiscovered } = options;

  // Normalize to root domain
  const normalizedRoot = extractRootUrl(rootUrl);
  const rootDomain = new URL(normalizedRoot).hostname;

  const errors: Array<{ url: string; error: string }> = [];
  let discoveredUrls: string[] = [];

  console.log(`[Discovery] Starting discovery for ${normalizedRoot}`);

  // Strategy 1: Try default sitemap
  const sitemapUrl = new URL('/sitemap.xml', normalizedRoot).toString();
  discoveredUrls = await fetchSitemap(sitemapUrl);

  // Strategy 2: If no URLs, check robots.txt for sitemap location
  if (discoveredUrls.length === 0) {
    console.log('[Discovery] No URLs in default sitemap, checking robots.txt');
    discoveredUrls = await findSitemapsInRobotsTxt(normalizedRoot);
  }

  // Strategy 3: If still no URLs, fallback to homepage scraping
  if (discoveredUrls.length === 0) {
    console.log(
      '[Discovery] No sitemaps found, falling back to homepage scraping'
    );
    discoveredUrls = await scrapeHomepageLinks(normalizedRoot, rootDomain);
  }

  // Filter and sort
  const uniqueUrls = Array.from(new Set(discoveredUrls)).filter((url) => {
    // Ensure same domain (double check)
    try {
      return new URL(url).hostname === rootDomain && !shouldSkipUrl(url);
    } catch {
      return false;
    }
  });

  // Notify for each discovered URL (limit to maxPages)
  const limitedUrls = sortByPriority(uniqueUrls).slice(0, maxPages);

  limitedUrls.forEach((url) => {
    onUrlDiscovered?.(url);
  });

  console.log(`[Discovery] Found ${limitedUrls.length} URLs for ${rootDomain}`);

  return {
    urls: limitedUrls,
    rootDomain,
    errors,
  };
}
