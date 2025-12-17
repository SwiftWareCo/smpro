import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";

export const connectedAccounts = pgTable("connected_accounts", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 191 }).notNull(), // Clerk user ID
  platform: varchar("platform", { length: 50 }).notNull(), // tiktok, youtube, instagram, facebook
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  platformUserId: varchar("platform_user_id", { length: 191 }),
  platformUsername: varchar("platform_username", { length: 191 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

