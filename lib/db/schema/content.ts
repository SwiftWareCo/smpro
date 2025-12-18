import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";
import { connectedAccounts } from "./platforms";

export const content = pgTable("content", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  accountId: varchar("account_id", { length: 191 }).references(
    () => connectedAccounts.id,
  ),
  platform: varchar("platform", { length: 50 }).notNull(),
  platformVideoId: varchar("platform_video_id", { length: 191 }).notNull(),

  // Content metadata
  mediaType: varchar("media_type", { length: 50 }), // VIDEO, REELS, IMAGE, CAROUSEL_ALBUM
  title: text("title"),
  description: text("description"),
  caption: text("caption"),
  thumbnailUrl: text("thumbnail_url"),
  mediaUrl: text("media_url"), // Can be video or image URL

  // Metrics (updated via sync)
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),

  // Metadata
  duration: integer("duration"), // seconds (for videos)
  publishedAt: timestamp("published_at"),
  rawData: jsonb("raw_data"), // Store full API response

  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});
