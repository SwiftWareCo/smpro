---
description: Coding conventions and best practices for this project
---

# Coding Conventions

## React & Next.js

- Prefer functional components
- Use React Server Components by default
- Use Client Components only when necessary (add 'use client' directive)
- Follow Next.js 16 App Router conventions
- Use async/await for server-side operations

## Types & Schema

- Have one single source of truth for types using `z.infer` from schema files
- Use `drizzle-zod` to create `createInsertSchema` and `createSelectSchema` in schema files
- For relations, also create types using drizzle-zod for the relation

## Forms & useForm

- Destructure methods from `useForm()` (e.g., `const { reset, handleSubmit, control } = useForm(...)`)
- Inline default values directly in `useForm()` options
- Call `reset()` when dialog closes to ensure form is pristine on reopen
- Do NOT store the form object in a variable when only using specific methods

## State Management

- Use React hooks for local state
- Avoid unnecessary useEffect - if component unmounts/remounts, state resets naturally

## File Organization

- CRUD operations should be in `lib/actions/[feature].ts` files
- Use server actions for data mutations

## Validation

// turbo-all

- Run `pnpm run check:types` after changes to confirm type safety
- Run `pnpm run check:eslint` after changes to confirm linting passes
