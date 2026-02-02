# Code Conventions

## Components
- Use React Server Components by default
- Use Client Components only when necessary (add `'use client'`)
- Follow Next.js App Router conventions

## Forms
- Call `reset()` when when dialog opens
- Import form schemas from schema files

## Data Flow
- Convex functions live in `convex/` as queries/mutations/actions
- Schemas are split in `convex/schema/*.schema.ts`

## Data Fetching (Next.js + Convex)
- Use `preloadQuery` + `usePreloadedQuery` only for data needed on initial paint (e.g., sidebar clients).
- Prefer `useQuery` in Client Components for reactive UI updates.
- Lazy-load `useQuery` for large tables or heavy data (only fetch when the UI needs it).
- Use `fetchQuery`/`fetchMutation`/`fetchAction` in Server Components, Server Actions, or Route Handlers for server-only needs (auth checks, redirects, non-reactive data).

## Convex Folder Convention (DB helpers + API layer)
Keep most logic in plain TS helpers and keep queries/mutations thin.

Suggested structure:
```
convex/
  db/
    users/
      read.ts
      write.ts
  users.ts            # API layer: queries/mutations for users
  schema.ts
```

- DB/model layer: plain TS helpers that read/write tables
- API layer: small query/mutation wrappers that call helpers
- Internal-only endpoints should still call the shared helpers
