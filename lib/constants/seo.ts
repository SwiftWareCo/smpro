// Predefined industries for standardization
// This file is shared between client and server

export const INDUSTRY_OPTIONS = [
  'restaurant',
  'retail',
  'healthcare',
  'construction',
  'automotive',
  'legal',
  'real_estate',
  'fitness',
  'salon_spa',
  'hvac',
  'cleaning',
  'plumbing',
  'landscaping',
  'dental',
  'veterinary',
  'other',
] as const;

export type IndustryType = (typeof INDUSTRY_OPTIONS)[number];

// Content size limits
export const MAX_CONTENT_LENGTH = 100000; // 100k chars for single-page Gemini
export const MIN_CONTENT_LENGTH = 50; // Minimum to analyze

// Multi-page crawl constants
export const MAX_AGGREGATE_CHARS = 800000; // 800k chars for multi-page (safe margin from Gemini's 1M)
export const MAX_PAGES_TO_CRAWL = 50; // Hard limit on pages
export const DEFAULT_MAX_PAGES = 20; // Default for UI slider
export const DEFAULT_CRAWL_DEPTH = 2; // How deep to follow links

// Page priority patterns (lower = higher priority)
// Homepage and key business pages are crawled first
export const PAGE_PRIORITY_PATTERNS = [
  { pattern: /^\/$/, priority: 0 }, // Homepage
  { pattern: /\/(about|company|who-we-are)/i, priority: 1 },
  { pattern: /\/(services?|products?|solutions?|offerings?)/i, priority: 2 },
  { pattern: /\/(contact|locations?|find-us)/i, priority: 3 },
  { pattern: /\/(pricing|plans|packages)/i, priority: 4 },
  { pattern: /\/(team|staff|people|leadership)/i, priority: 5 },
  { pattern: /\/(faq|help|support)/i, priority: 6 },
  { pattern: /\/(testimonials?|reviews?|case-studies)/i, priority: 7 },
  { pattern: /\/(portfolio|work|projects)/i, priority: 8 },
  { pattern: /\/(blog|news|articles|posts)/i, priority: 10 }, // Lower priority for content pages
] as const;

// File extensions to skip during crawling
export const SKIP_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.css',
  '.js',
  '.json',
  '.xml',
  '.txt',
  '.zip',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
] as const;
