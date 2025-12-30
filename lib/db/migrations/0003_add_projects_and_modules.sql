-- Create module_type enum
DO $$ BEGIN
 CREATE TYPE "module_type" AS ENUM('social', 'seo', 'website_gmb', 'ai_receptionist', 'automations', 'assets');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"client_id" varchar(191) NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"name" varchar(191) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "project_modules" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"project_id" varchar(191) NOT NULL,
	"module_type" "module_type" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"enabled_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "project_seo_settings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"project_id" varchar(191) NOT NULL,
	"website_url" text,
	"target_keywords" text[],
	"target_locations" text[],
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "project_modules" ADD CONSTRAINT "project_modules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "project_seo_settings" ADD CONSTRAINT "project_seo_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "unique_project_module" ON "project_modules" ("project_id","module_type");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "unique_project_seo_settings" ON "project_seo_settings" ("project_id");
--> statement-breakpoint

-- Add project_id column to connected_accounts
ALTER TABLE "connected_accounts" ADD COLUMN IF NOT EXISTS "project_id" varchar(191);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

