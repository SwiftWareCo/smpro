CREATE TABLE "client_seo_settings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"client_id" varchar(191) NOT NULL,
	"website_url" text,
	"target_keywords" text[],
	"target_locations" text[],
	"meta_title" text,
	"meta_description" text,
	"industry" varchar(50),
	"analyzed_at" timestamp,
	"analysis_provider" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"name" varchar(191) NOT NULL,
	"description" text,
	"avatar_url" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"enabled_modules" text[] DEFAULT ARRAY['social']::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"account_id" varchar(191),
	"platform" varchar(50) NOT NULL,
	"platform_video_id" varchar(191) NOT NULL,
	"media_type" varchar(50),
	"title" text,
	"description" text,
	"caption" text,
	"thumbnail_url" text,
	"media_url" text,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"duration" integer,
	"published_at" timestamp,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "videos" CASCADE;--> statement-breakpoint
DROP INDEX "unique_connection";--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD COLUMN "client_id" varchar(191);--> statement-breakpoint
ALTER TABLE "client_seo_settings" ADD CONSTRAINT "client_seo_settings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_account_id_connected_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;