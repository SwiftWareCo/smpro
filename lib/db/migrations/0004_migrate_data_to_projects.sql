-- Data migration: Create default projects for existing clients and link accounts

-- Step 1: Create default "General" projects for all existing clients
-- Using a function to generate nanoid-like IDs (21 characters, alphanumeric)
CREATE OR REPLACE FUNCTION generate_nanoid() RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..21 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create default projects for all existing clients
INSERT INTO "projects" ("id", "client_id", "user_id", "name", "status", "is_default", "created_at", "updated_at")
SELECT 
  generate_nanoid(),
  "id",
  "user_id",
  'General',
  'active',
  true,
  "created_at",
  "updated_at"
FROM "clients"
WHERE NOT EXISTS (
  SELECT 1 FROM "projects" p WHERE p."client_id" = "clients"."id" AND p."is_default" = true
);

-- Step 2: Enable 'social' module for all default projects
INSERT INTO "project_modules" ("id", "project_id", "module_type", "is_enabled", "enabled_at", "updated_at")
SELECT 
  generate_nanoid(),
  "id",
  'social',
  true,
  NOW(),
  NOW()
FROM "projects"
WHERE "is_default" = true
AND NOT EXISTS (
  SELECT 1 FROM "project_modules" pm 
  WHERE pm."project_id" = "projects"."id" 
  AND pm."module_type" = 'social'
);

-- Step 3: Link connected_accounts to projects based on clientId
UPDATE "connected_accounts" ca
SET "project_id" = (
  SELECT p."id" 
  FROM "projects" p 
  WHERE p."client_id" = ca."client_id" 
  AND p."is_default" = true 
  LIMIT 1
)
WHERE ca."client_id" IS NOT NULL
AND ca."project_id" IS NULL;

-- Step 4: Handle orphaned accounts (no clientId)
-- Create "Personal" client for users with orphaned accounts, then link them
-- First, create Personal clients for users who have orphaned accounts
INSERT INTO "clients" ("id", "user_id", "name", "description", "created_at", "updated_at")
SELECT DISTINCT ON (ca."user_id")
  generate_nanoid(),
  ca."user_id",
  'Personal',
  'Default client for personal accounts',
  NOW(),
  NOW()
FROM "connected_accounts" ca
WHERE ca."client_id" IS NULL
AND ca."project_id" IS NULL
AND NOT EXISTS (
  SELECT 1 FROM "clients" c 
  WHERE c."user_id" = ca."user_id" 
  AND c."name" = 'Personal'
);

-- Create default "General" project for Personal clients
INSERT INTO "projects" ("id", "client_id", "user_id", "name", "status", "is_default", "created_at", "updated_at")
SELECT 
  generate_nanoid(),
  c."id",
  c."user_id",
  'General',
  'active',
  true,
  NOW(),
  NOW()
FROM "clients" c
WHERE c."name" = 'Personal'
AND NOT EXISTS (
  SELECT 1 FROM "projects" p 
  WHERE p."client_id" = c."id" 
  AND p."is_default" = true
);

-- Enable 'social' module for Personal projects
INSERT INTO "project_modules" ("id", "project_id", "module_type", "is_enabled", "enabled_at", "updated_at")
SELECT 
  generate_nanoid(),
  p."id",
  'social',
  true,
  NOW(),
  NOW()
FROM "projects" p
INNER JOIN "clients" c ON p."client_id" = c."id"
WHERE c."name" = 'Personal'
AND p."is_default" = true
AND NOT EXISTS (
  SELECT 1 FROM "project_modules" pm 
  WHERE pm."project_id" = p."id" 
  AND pm."module_type" = 'social'
);

-- Link orphaned accounts to Personal projects
UPDATE "connected_accounts" ca
SET "project_id" = (
  SELECT p."id"
  FROM "projects" p
  INNER JOIN "clients" c ON p."client_id" = c."id"
  WHERE c."user_id" = ca."user_id"
  AND c."name" = 'Personal'
  AND p."is_default" = true
  LIMIT 1
)
WHERE ca."client_id" IS NULL
AND ca."project_id" IS NULL;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS generate_nanoid();

