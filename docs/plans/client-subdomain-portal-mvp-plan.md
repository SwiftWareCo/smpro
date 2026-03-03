# Client Subdomain Portal MVP Plan

## Why This Plan Exists
Enable a client-specific portal accessible by subdomain, with Clerk organization provisioning during client creation, and immediate creation of a portal admin user.

## Scope Lock (MVP)
In scope
- Subdomain-aware tenant routing.
- Clerk org creation with org slug.
- Portal admin user creation at client onboarding.
- Tenant isolation so portal admins can only access their own client portal.
- Base portal UI with dashboard landing page and floating sidebar.
- Per-client two-color theme customization.

Out of scope
- Billing and subscriptions.
- Advanced multi-page portal IA beyond dashboard landing.
- Full design system/theming editor.
- Cross-tenant admin switching UX.

## Critical Constraint Decision (2026-03-02)
- Decision: proceed with custom domains for MVP using `admin.swiftware.ca` (agency app) and `*.clients.swiftware.ca` (tenant portals), while keeping routing domain-agnostic via env vars.
- Implementation rule: all host parsing and tenant resolution must read from `TENANT_ROOT_DOMAIN`, not hardcoded hostnames.
- Status: domain prerequisite is complete (`admin.swiftware.ca` and wildcard tenant host are resolving).

## Environment Variables (Planned)
- `TENANT_ROOT_DOMAIN=clients.swiftware.ca`
- `APP_ROOT_DOMAIN=admin.swiftware.ca`
- `NEXT_PUBLIC_APP_URL=https://admin.swiftware.ca`
- `NEXT_PUBLIC_TENANT_ROOT_DOMAIN=clients.swiftware.ca` (for client-side portal URL display/copy UX)

## Step 1: Extend Client Data Model
- [x] Add client fields: `slug`, `clerkOrganizationId`, `portalPrimaryColor`, `portalSecondaryColor`.
- [x] Add indexes for `slug` and `clerkOrganizationId`.
- [x] Skip migration/backfill (clients table is empty at this stage).

Acceptance Criteria
- [x] Convex schema compiles with new fields and indexes.
- [x] New clients receive a unique slug at creation time.
- [x] Existing add-client flow remains readable/writable after schema update.

## Step 2: Build Provisioning Orchestrator
- [x] Add a server-side endpoint/function for onboarding.
- [x] Create Clerk organization with slug.
- [x] Create portal admin user with password.
- [x] Add admin user to org with admin role.
- [x] Persist client row with org/user IDs and theme colors.
- [x] Return onboarding payload including portal URL and admin email.
- [x] Implement failure compensation (cleanup) for partial provisioning failures.

Acceptance Criteria
- [x] Single request provisions org + admin user + client row.
- [x] Duplicate slug/email produces clear validation error.
- [x] No orphaned org/user remains after orchestrator failure.

## Step 3: Update Add Client Flow UI
- [x] Update add-client form to include slug, admin email, password, primary color, secondary color.
- [x] Validate slug format and reserved words.
- [x] Submit to new provisioning endpoint.
- [x] Show success confirmation with tenant portal URL.

Acceptance Criteria
- [x] Invalid slug/email/password is blocked before submit.
- [x] Success state includes working tenant URL format: `https://[slug].TENANT_ROOT_DOMAIN`.
- [x] New client appears in existing dashboard list.

## Step 4: Add Host-Based Tenant Routing
- [x] Add host parser utility that resolves tenant slug from request host.
- [x] Update middleware/proxy to route tenant hosts to portal app surface.
- [x] Add unknown-tenant handling (404 or controlled error page).

Acceptance Criteria
- [x] Root host routes to agency dashboard.
- [x] Tenant host routes to tenant portal.
- [x] Unknown tenant host cannot access dashboard data.

## Step 5: Enforce Tenant AuthZ Boundary
- [x] Add server checks requiring user membership in the Clerk org mapped to tenant slug.
- [x] Block cross-tenant access by host/org mismatch.
- [x] Restrict portal admins to tenant portal only.

Acceptance Criteria
- [x] Portal admin can access only their own `[slug]` host.
- [x] Same user is blocked on other tenant hosts.
- [x] Unauthorized access returns redirect or 403 consistently.

## Step 6: Create Base Portal UI
- [x] Add tenant portal layout and dashboard page as tenant landing.
- [x] Implement light blue + white default theme.
- [x] Implement floating sidebar pattern for tenant navigation.
- [x] Apply per-client two-color theme tokens from client settings.
- [x] Use existing shadcn variables for tenant colors: `--primary`, `--secondary`, `--ring`, `--sidebar-primary`, `--sidebar-accent`.

Acceptance Criteria
- [x] Tenant dashboard loads on first visit for valid tenant host.
- [x] UI uses light-blue/white default theme when custom colors are missing.
- [x] Custom colors are reflected per tenant without leaking between tenants.
- [x] Layout is usable on desktop and mobile.

## Step 7: Portal Admin User Management
- [ ] Add tenant “Users” area or direct Clerk org management integration for adding users.
- [ ] Ensure only org admins can add users.
- [ ] Ensure invited/added users inherit tenant-bound access.

Acceptance Criteria
- [ ] Portal admin can add/invite users for their org.
- [ ] Non-admin cannot add users.
- [ ] New users can access only that tenant portal.

## Step 8: Validation and Rollout Checklist
- [x] Run `pnpm run lint:types`.
- [x] Run `pnpm run lint:eslint`.
- [ ] Execute manual E2E smoke test: create client.
- [ ] Execute manual E2E smoke test: confirm org and admin user created.
- [ ] Execute manual E2E smoke test: sign in as portal admin.
- [ ] Execute manual E2E smoke test: open `https://[slug].TENANT_ROOT_DOMAIN`.
- [ ] Execute manual E2E smoke test: confirm dashboard loads and other tenant hosts are blocked.

Acceptance Criteria
- [ ] Typecheck and lint pass.
- [ ] End-to-end onboarding flow is successful.
- [ ] Tenant isolation is verified with negative tests.

## Definition of Done (MVP)
- [ ] A newly created client has a unique slug, Clerk organization, and portal admin user.
- [ ] Portal admin can sign in and access only `https://[slug].TENANT_ROOT_DOMAIN`.
- [ ] Tenant dashboard is the landing page with floating sidebar.
- [ ] Two-color portal customization works per client.
- [ ] Domain can be switched later by changing env var(s), without rewriting tenant routing/authz logic.
