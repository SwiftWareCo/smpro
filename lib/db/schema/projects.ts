import { sql } from 'drizzle-orm';
import { pgTable, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { nanoid } from '@/lib/utils';
import { clients } from './clients';

export const projects = pgTable('projects', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  clientId: varchar('client_id', { length: 191 })
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 191 }).notNull(), // Denormalized for performance
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 })
    .notNull()
    .default('active'), // 'active' | 'archived' | 'paused'
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
});

