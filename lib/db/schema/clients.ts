import { sql } from 'drizzle-orm';
import { pgTable, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { nanoid } from '@/lib/utils';

// Status options as const for type-safety
export const clientStatusOptions = [
  'lead',
  'onboarding',
  'active',
  'paused',
  'churned',
] as const;
export type ClientStatus = (typeof clientStatusOptions)[number];

export const clients = pgTable('clients', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar('user_id', { length: 191 }).notNull(), // Clerk user ID of agency owner
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 50 }).notNull().default('active'), // 'lead' | 'onboarding' | 'active' | 'paused' | 'churned'
  enabledModules: text('enabled_modules')
    .array()
    .default(sql`ARRAY['social']::text[]`), // Array of enabled module types
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
});

// Zod schemas for validation
export const insertClientSchema = createInsertSchema(clients, {
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(191, 'Name is too long'),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .optional()
    .nullable(),
  avatarUrl: z
    .url('Please enter a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.enum(clientStatusOptions),
});

export const selectClientSchema = createSelectSchema(clients);

// Types derived from schemas (single source of truth)
export type Client = z.infer<typeof selectClientSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;

// Form schema for client settings (subset of fields that can be edited)
export const clientFormSchema = insertClientSchema.pick({
  name: true,
  description: true,
  avatarUrl: true,
  status: true,
});
export type ClientFormValues = z.infer<typeof clientFormSchema>;
