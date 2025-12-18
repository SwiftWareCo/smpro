-- Add client_business_id column to connected_accounts for Meta Business Integration
ALTER TABLE "connected_accounts" ADD COLUMN IF NOT EXISTS "client_business_id" varchar(191);
