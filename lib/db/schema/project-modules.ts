import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { nanoid } from '@/lib/utils';
import { projects } from './projects';

export const moduleTypeEnum = pgEnum('module_type', [
  'social',
  'seo',
  'website_gmb',
  'ai_receptionist',
  'automations',
  'assets',
]);

export const projectModules = pgTable(
  'project_modules',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    projectId: varchar('project_id', { length: 191 })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    moduleType: moduleTypeEnum('module_type').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    config: jsonb('config'), // Module-specific settings
    enabledAt: timestamp('enabled_at').default(sql`now()`),
    updatedAt: timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    {
      // Unique constraint: one module type per project
      uniqueProjectModule: uniqueIndex('unique_project_module').on(
        table.projectId,
        table.moduleType
      ),
    },
  ]
);

