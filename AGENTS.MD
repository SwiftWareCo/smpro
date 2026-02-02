# SM Pro - Agency CRM (Context Index)

## Read This First
Start with the general context docs in `docs/context/` (in order):
1. `docs/context/overview.md`
2. `docs/context/project-structure.md`
3. `docs/context/tech-stack.md`
4. `docs/context/conventions.md`
5. `docs/context/convex-typing.md`

## Targeted Feature Context
For feature-specific work, **do not load all docs**. Open only the relevant file(s) in:
- `docs/features/`

This keeps context focused and prevents pulling in unrelated modules.

## Core Concepts (Quick Reference)
- SM Pro is an internal agency CRM (not a self-serve SaaS).
- Modules are verticals (Social, SEO, AI Receptionist). Client workspaces show tabs based on `enabledModules`.
- Follow the Convex DB helper + API layer convention:
  - `convex/db/**` for reusable read/write helpers
  - `convex/*.ts` for thin query/mutation wrappers

## Add Client Flow (Entry Point)
The add-client flow begins in:
- `components/dashboard/app-sidebar.tsx`

Use this file as the entry point when tracing the creation flow.

## Implementation Rules
- Prefer React Server Components; add `'use client'` only when required.
- Use absolute imports with `@/`.
- Keep files single-responsibility; create new files if it improves clarity.

## Checks After Changes
Run:
- `pnpm run lint:types`
- `pnpm run lint:eslint`

## Explain After Implementation
Include:
1. What command(s) need to be run
2. Why they are needed
3. Any data implications
