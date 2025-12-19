import { sql } from 'drizzle-orm';
import { pgTable, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { nanoid } from '@/lib/utils';

export const clients = pgTable('clients', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar('user_id', { length: 191 }).notNull(), // Clerk user ID of agency owner
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
});
