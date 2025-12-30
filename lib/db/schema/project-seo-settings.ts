import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { nanoid } from '@/lib/utils';
import { projects } from './projects';

export const projectSeoSettings = pgTable(
  'project_seo_settings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    projectId: varchar('project_id', { length: 191 })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    websiteUrl: text('website_url'),
    targetKeywords: text('target_keywords').array(), // Array of keywords
    targetLocations: text('target_locations').array(), // Array of locations
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    {
      // Unique constraint: one SEO settings record per project
      uniqueProjectSeoSettings: uniqueIndex('unique_project_seo_settings').on(
        table.projectId
      ),
    },
  ]
);

