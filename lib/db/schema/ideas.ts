import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";

export const savedIdeas = pgTable("saved_ideas", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 191 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  confidence: integer("confidence"),
  basedOnVideoIds: text("based_on_video_ids").array(),
  isTrending: boolean("is_trending").default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

