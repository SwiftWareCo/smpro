import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { nanoid } from '@/lib/utils';
import { clients } from './clients';

export const clientSeoSettings = pgTable(
  'client_seo_settings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    clientId: varchar('client_id', { length: 191 })
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    websiteUrl: text('website_url'),
    targetKeywords: text('target_keywords').array(), // Array of keywords
    targetLocations: text('target_locations').array(), // Array of locations
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    // New fields for AI analysis
    industry: varchar('industry', { length: 50 }), // e.g., 'restaurant', 'healthcare', etc.
    analyzedAt: timestamp('analyzed_at'), // When AI analysis was last performed
    analysisProvider: varchar('analysis_provider', { length: 20 }), // 'jina' or 'firecrawl'
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    {
      // Unique constraint: one SEO settings record per client
      uniqueClientSeoSettings: uniqueIndex('unique_client_seo_settings').on(
        table.clientId
      ),
    },
  ]
);
