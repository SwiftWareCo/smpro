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

export const connectedAccounts = pgTable(
  'connected_accounts',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: varchar('user_id', { length: 191 }).notNull(), // Clerk user ID
    clientId: varchar('client_id', { length: 191 }).references(
      () => clients.id
    ), // Optional: link to a client/brand
    platform: varchar('platform', { length: 50 }).notNull(), // tiktok, youtube, instagram, facebook
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    platformUserId: varchar('platform_user_id', { length: 191 }),
    platformUsername: varchar('platform_username', { length: 191 }),
    clientBusinessId: varchar('client_business_id', { length: 191 }), // Meta Business Integration client ID
    tokenExpiresAt: timestamp('token_expires_at'),
    createdAt: timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    {
      // Prevent duplicate connections for same user + platform + account
      uniqueConnection: uniqueIndex('unique_connection').on(
        table.userId,
        table.platform,
        table.platformUserId
      ),
    },
  ]
);
