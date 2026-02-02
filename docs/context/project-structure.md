# Project Structure

```
app/
  (dashboard)/          # Main dashboard routes
  (workspace)/          # Client workspace routes
  convex-client-provider.tsx
components/
  ui/                   # shadcn/ui components
  dashboard/            # Dashboard-specific
  workspace/            # Client workspace components
  social/               # Social module components
  seo/                  # SEO module components
  ai-receptionist/      # AI Receptionist module (future)
convex/
  schema.ts             # Convex schema entry
  schema/               # Table schema modules (tablename.schema.ts)
  _generated/           # Convex generated types
lib/
  services/
  constants/
  utils/                # Utilities
```
