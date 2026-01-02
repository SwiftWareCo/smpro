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
export const MAX_CONTENT_LENGTH = 100000; // 100k chars for Gemini
export const MIN_CONTENT_LENGTH = 50; // Minimum to analyze
