-- Rename videos table to content and add new columns
ALTER TABLE "videos" RENAME TO "content";

-- Add media_type column
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "media_type" varchar(50);

-- Rename video_url to media_url
ALTER TABLE "content" RENAME COLUMN "video_url" TO "media_url";

-- Set default media_type for existing records (all existing are videos/reels)
UPDATE "content" SET "media_type" = 'VIDEO' WHERE "media_type" IS NULL;
