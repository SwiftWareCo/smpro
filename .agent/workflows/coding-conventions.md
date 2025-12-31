---
description: Coding conventions and best practices for this project
---

# SM Pro Coding Conventions

## Project Context

SM Pro is an **agency CRM** for managing clients across:

- Social Media Management
- SEO Services
- AI Receptionist (future)

You are the agency operator using this tool to manage client accounts.

---

## React & Next.js

- Prefer functional components
- Use React Server Components by default
- Use Client Components only when necessary (add `'use client'` directive)
- Follow Next.js 16 App Router conventions
- Use async/await for server-side operations

---

## Types & Schema

- **Single source of truth** for types using `z.infer` from schema files
- Use `drizzle-zod` to create `createInsertSchema` and `createSelectSchema`
- For relations, create types using drizzle-zod
- Export types alongside table definitions

Example:

```typescript
// lib/db/schema/clients.ts
export const clients = pgTable('clients', { ... });
export const insertClientSchema = createInsertSchema(clients, { ... });
export const selectClientSchema = createSelectSchema(clients);
export type Client = z.infer<typeof selectClientSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
```

---

## Forms & useForm

- Destructure methods from `useForm()` when only using specific methods
- Inline default values directly in `useForm()` options
- Call `reset()` when dialog closes to ensure form is pristine on reopen
- Import form schemas from schema files (not inline zod objects)

---

## State Management

- Use React hooks for local state
- Avoid unnecessary `useEffect` - if component unmounts/remounts, state resets naturally
- Don't add dependencies to useEffect that cause loops (e.g., `form` object)

---

## File Organization

- **Server Actions**: `lib/actions/[feature].ts` for mutations
- **Data Access**: `lib/data/data.[feature].ts` for queries
- **Schemas**: `lib/db/schema/[table].ts` with drizzle + zod
- **Utilities**: `lib/utils/` or `lib/utils.ts`

---

## Module System

Clients enable modules via `enabledModules` array. Each module should:

1. Have a tab component in `components/[module]/`
2. Add checklist items to `lib/utils/setup-checklist.ts`
3. Have its own schema file if storing settings

---

## Validation

// turbo-all

- Run `pnpm run check:types` after changes to confirm type safety
- Run `pnpm run check:eslint` after changes to confirm linting passes
