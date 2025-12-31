# SM Pro - Agency CRM

## Implementation Plan

---

## What is SM Pro?

**SM Pro is an internal agency CRM** for managing clients across multiple service verticals:

- **Social Media Management** - Instagram/Facebook content sync and analytics
- **SEO Services** - Website tracking, keyword management
- **AI Receptionist** - Voice AI for inbound calls (healthcare focus)

**You are the agency operator** using this tool to manage your client accounts. This is NOT a self-serve SaaS product for end-users.

---

## Current State

**Implemented**:

- ✅ Client workspace at `/workspace/[clientId]`
- ✅ Module enablement system (`enabledModules` array)
- ✅ Workspace header with status, next steps, settings
- ✅ Dynamic setup checklist engine
- ✅ Dashboard with "At Risk" clients
- ✅ Instagram/Facebook OAuth via Meta
- ✅ Client CRUD with server actions
- ✅ `client_seo_settings` table
- ✅ Drizzle-zod schemas with type exports

**In Progress**:

- 🔄 Social Tab polish (account banners, content feed)
- 🔄 SEO Tab MVP (form-based settings)

**Planned**:

- ⏳ AI Receptionist module (see `docs/VOICE-AI-PROVIDERS.md`)
- ⏳ Strategy tagging on content
- ⏳ Basic analytics charts

**Deferred**:

- ❌ Pipeline kanban board (not needed until 15+ clients)
- ❌ TikTok/YouTube OAuth (complex approval process)
- ❌ Blog queue / content publishing

---

## Architecture Decisions

### 1. Client-Centric (No Projects Layer)

Modules are enabled directly on clients via `enabledModules` array. No intermediate "project" concept.

### 2. Module System

Each client can have different modules enabled:

```typescript
enabledModules: ['social', 'seo', 'ai-receptionist', 'assets'];
```

Only enabled modules appear as tabs in the workspace.

### 3. Internal Tool, Not SaaS

No client-facing portal, no self-service. You control everything.

---

## Core UX Model

### Left Sidebar (Global Navigation)

- Dashboard (cross-client overview)
- Settings (user preferences only)
- Clients section (search + list + add)

### Client Workspace Layout

**Header**:

- Client name + avatar
- Status badge (Lead / Onboarding / Active / Paused / Churned)
- Next Steps popover
- Settings + Add Module buttons

**Body** (Dynamic module tabs):

- Overview (always visible)
- Social (if enabled)
- SEO (if enabled)
- AI Receptionist (if enabled)
- Assets (if enabled - placeholder)

---

## Current Priorities

### Priority 1: Social Tab Polish

- Move account connections from Settings to Social Tab
- Platform banners showing connected/not-connected status
- Content grid with filtering
- Integrate into setup checklist

### Priority 2: SEO Tab MVP

- Website URL field
- Keywords tags input
- Locations tags input
- PageSpeed test button (optional)

### Priority 3: AI Receptionist Research

- Evaluate voice AI providers (Vapi, Retell, Bland)
- Build minimal config UI when ready

---

## Implementation Phases

## **PHASE 1: Database Migration (Foundation)**

**Goal**: Add Projects, Modules, and SEO Settings tables; migrate existing data safely.

### Database Schema Changes

#### 1.1 New Tables to Create

**`projects` table**:

```typescript
{
  id: string (PK)
  clientId: string (FK → clients.id, CASCADE)
  userId: string (denormalized for performance)
  name: string
  description: string | null
  status: 'active' | 'archived' | 'paused'
  isDefault: boolean (one per client)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**`project_modules` table** (junction table):

```typescript
{
  id: string (PK)
  projectId: string (FK → projects.id, CASCADE)
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets'
  isEnabled: boolean
  config: jsonb (module-specific settings)
  enabledAt: timestamp
  updatedAt: timestamp
}
```

_Unique constraint on (projectId, moduleType)_

**`project_seo_settings` table**:

```typescript
{
  id: string (PK)
  projectId: string (FK → projects.id, CASCADE, UNIQUE)
  websiteUrl: text | null
  targetKeywords: text[] (array)
  targetLocations: text[] (array)
  metaTitle: text | null
  metaDescription: text | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 1.2 Modify Existing Tables

**`connected_accounts` table** - ADD:

- `projectId: string | null` (FK → projects.id, CASCADE)
- Keep existing `clientId` for backward compatibility during migration

**Migration strategy**:

- Maintain DUAL LINKING during transition (both clientId and projectId)
- clientId will be deprecated later but kept for now

#### 1.3 Data Migration Logic

**Auto-create default projects**:

1. For each existing client → create "General" project (isDefault: true)
2. Enable 'social' module for all default projects (since all existing data is social media content)
3. Link all connected_accounts with clientId → find default project → set projectId
4. Handle orphaned accounts (no clientId) → create "Personal" client + project

**SQL Migration Files**:

- `0003_add_projects_and_modules.sql` (schema changes)
- `0004_migrate_data_to_projects.sql` (data migration)

### Files to Create/Modify

**CREATE**:

- `lib/db/schema/projects.ts` - Projects table schema
- `lib/db/schema/project-modules.ts` - Modules junction table
- `lib/db/schema/project-seo-settings.ts` - SEO settings table
- `lib/data/data.projects.ts` - CRUD operations for projects
- `lib/actions/projects.ts` - Server actions for project management
- `migrations/0003_add_projects_and_modules.sql`
- `migrations/0004_migrate_data_to_projects.sql`

**MODIFY**:

- `lib/db/schema/platforms.ts` - Add projectId column
- `lib/db/schema/index.ts` - Export new schemas
- `lib/data/data.accounts.ts` - Add getAccountsByProject()
- `lib/data/data.content.ts` - Add getContentByProject(), update getContent() with project filtering

### Success Criteria

- [ ] All clients have at least one default "General" project
- [ ] All connected_accounts have valid projectId
- [ ] All default projects have 'social' module enabled
- [ ] No data loss (all existing clients, accounts, content preserved)
- [ ] Backward compatible queries still work

---

## **PHASE 2: App Shell + Client Workspace UX**

**Goal**: Build the core navigation structure and client workspace layout.

### 2.1 Update Global Navigation (Sidebar)

**Current sidebar** (remove):

- ❌ Ideas (global nav)
- ❌ Import (global nav)
- ❌ "All Content" link

**New sidebar structure**:

```
Dashboard
Pipeline (new)
---
Clients
  [Search clients...]
  Client A
    → General (project)
    → Social Growth Q1 (project)
  Client B
    → General (project)
  + Add Client
---
Settings
```

**Component changes**:

- Modify `components/dashboard/app-sidebar.tsx`:
  - Remove Ideas and Import from main nav
  - Add Pipeline nav item
  - Change client list to show nested projects
  - Add project selection state
  - Update active state tracking (client + project)

### 2.2 Create Client Workspace Page

**New route**: `/workspace/[clientId]` (replaces `/content`)

**Layout structure**:

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                  │
│ [Avatar] Client Name           [Status: Active ▼]      │
│ Project: General ▼             [+ Add Module] [⚙️]      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────┬───────────────────────────┐
│ Tabs (dynamic)              │ Right Panel               │
│ • Overview                  │ Next Steps / Missing      │
│ • Social ✓                  │ ☐ TikTok not connected    │
│ • SEO ✓                     │ ☐ Website URL missing     │
│ • + Add module              │ ☐ No target keywords      │
│                             │                           │
│ [Active Tab Content]        │                           │
│                             │                           │
└─────────────────────────────┴───────────────────────────┘
```

**Components to create**:

- `app/(workspace)/workspace/[clientId]/page.tsx` - Main workspace page
- `components/workspace/workspace-header.tsx` - Client name, status, project dropdown
- `components/workspace/workspace-tabs.tsx` - Dynamic tabs based on enabled modules
- `components/workspace/overview-tab.tsx` - Health tiles + setup checklist
- `components/workspace/next-steps-panel.tsx` - Right sidebar with missing items
- `components/workspace/module-enablement-dialog.tsx` - Add/remove modules UI

### 2.3 Overview Tab (Default View)

**Top Row** - Health Tiles (status cards):

- Social: Connected accounts count, posting cadence placeholder
- SEO: Website connected? Keywords set? (if module enabled)
- Other modules: Placeholder cards showing "Not enabled" or "Coming soon"

**Middle Section** - Setup Checklist:

```
Project Setup Progress: 3/7 complete

✓ Client created
✓ Project created
☐ Connect Instagram account
☐ Connect Facebook account
☐ Add website URL (SEO)
☐ Set target keywords (SEO)
☐ Upload brand assets
```

**Bottom Section** - Internal Notes/Tasks:

- Simple textarea for project notes
- Lightweight task list (optional, can be Phase 3+)

### 2.4 Module Tabs (Conditional Rendering)

**Social Tab** - Only shows if 'social' module enabled:

- Connected Accounts section
- Content Feed (enhanced from existing /content page)
- Ideas/Strategy section (placeholder for now)

**SEO Tab** - Only shows if 'seo' module enabled:

- Website URL input
- Target Keywords (tags input)
- Target Locations (tags input)
- Placeholder for "Blog Queue" (Phase 4)
- Placeholder for "Site Health" (optional)

**Placeholder Tabs** (AI Receptionist, Automations, Assets):

- Show "Coming Soon" card
- Brief description of what the module will do
- "Disable module" option

### 2.5 Project Management UI

**Project Dropdown** (in workspace header):

- Lists all projects for current client
- Shows default project first
- "Manage Projects" option → opens dialog

**Manage Projects Dialog**:

- List of projects with edit/archive actions
- "Create New Project" button
- Enable/disable modules per project

### Files to Create/Modify

**CREATE**:

- `app/(workspace)/layout.tsx` - New workspace layout
- `app/(workspace)/workspace/[clientId]/page.tsx`
- `components/workspace/workspace-header.tsx`
- `components/workspace/workspace-tabs.tsx`
- `components/workspace/overview-tab.tsx`
- `components/workspace/social-tab.tsx`
- `components/workspace/seo-tab.tsx`
- `components/workspace/placeholder-module-tab.tsx`
- `components/workspace/next-steps-panel.tsx`
- `components/workspace/project-dropdown.tsx`
- `components/workspace/manage-projects-dialog.tsx`
- `components/workspace/module-enablement-dialog.tsx`

**MODIFY**:

- `components/dashboard/app-sidebar.tsx` - Update navigation structure
- `app/(dashboard)/content/page.tsx` - Redirect to new workspace route or remove

### Success Criteria

- [ ] Can navigate from sidebar → client → project
- [ ] Workspace header shows client info + project dropdown
- [ ] Overview tab displays with health tiles + checklist
- [ ] Module tabs appear/disappear based on enabled modules
- [ ] Can switch between projects for a client
- [ ] Can enable/disable modules and see tabs update
- [ ] Next Steps panel shows relevant missing items

---

## **PHASE 3: Pipeline (CRM) + Setup Checklist Engine**

**Goal**: Build the sales pipeline kanban board and smart "missing items" detection.

### 3.1 Client Status/Stage System

**Add to `clients` table**:

- `status: string` - One of: 'lead', 'onboarding', 'active', 'paused', 'churned'
- Default: 'lead'

**Migration**:

- Set all existing clients to 'active' status

### 3.2 Pipeline Kanban Board

**New route**: `/pipeline`

**Layout**: Horizontal kanban with 5 columns:

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Lead    │Onboard  │ Active  │ Paused  │Churned  │
│ (3)     │ (2)     │ (12)    │ (1)     │ (5)     │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ [Card]  │ [Card]  │ [Card]  │         │ [Card]  │
│ [Card]  │ [Card]  │ [Card]  │         │ [Card]  │
│ [Card]  │         │ [Card]  │         │         │
│         │         │ ...     │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

**Client Card** (in each column):

- Client avatar + name
- Active project name
- Enabled modules (icon badges)
- **Setup completeness**: "3/7 complete" progress bar
- **Missing items chips**: "No TikTok", "No Website URL" (max 2 shown)
- Click → Opens client workspace

**Drag & Drop**:

- Use `@dnd-kit/core` (or similar)
- Drag client cards between columns
- Updates client.status on drop
- Optimistic UI update + server action

### 3.3 Setup Checklist Engine (Smart "Missing Items")

**Create checklist rules** per module:

**Base Setup** (always):

- ✓ Client created
- ✓ Default project exists
- ☐ Client has avatar
- ☐ Client has description

**Social Module**:

- ☐ Instagram account connected
- ☐ Facebook account connected
- ☐ TikTok account connected
- ☐ YouTube account connected
- ☐ At least 10 posts synced

**SEO Module**:

- ☐ Website URL set
- ☐ At least 1 target keyword
- ☐ At least 1 target location

**Assets Module** (placeholder):

- ☐ Logo uploaded
- ☐ Brand colors set
- ☐ Tone of voice notes added

**Component**:

- `lib/utils/setup-checklist.ts` - Checklist rule engine
  - Function: `getProjectSetupStatus(projectId)` → returns checklist items + completion %
  - Function: `getMissingItems(projectId)` → returns top 3 missing items for cards

**Usage**:

- Pipeline cards call `getMissingItems()` to show chips
- Overview tab calls `getProjectSetupStatus()` to show full checklist
- Next Steps panel uses same data

### 3.4 Dashboard Updates

**Replace empty dashboard** (`app/(dashboard)/page.tsx`) with:

**Section 1: At Risk / Missing Setup** (top priority):

- List of clients with setup < 50% complete
- Shows client name, project, completion %, primary missing item
- Click → Jump to client workspace

**Section 2: Pipeline Snapshot**:

- Count cards: "3 Leads, 2 Onboarding, 12 Active, 1 Paused, 5 Churned"
- Quick link to Pipeline page

**Section 3: Recent Activity** (timeline):

- "Instagram connected for Client A - General"
- "Content synced: 15 new posts for Client B"
- "Project created: Social Growth Q1 for Client C"
- Uses activity log (can be simple for now)

### Files to Create/Modify

**CREATE**:

- `app/(dashboard)/pipeline/page.tsx` - Kanban board
- `components/pipeline/pipeline-board.tsx` - Drag & drop board
- `components/pipeline/pipeline-column.tsx` - Single column
- `components/pipeline/client-card.tsx` - Draggable client card
- `lib/utils/setup-checklist.ts` - Checklist engine
- `lib/actions/clients.ts` - Add updateClientStatus() action
- `migrations/0005_add_client_status.sql` - Add status column

**MODIFY**:

- `lib/db/schema/clients.ts` - Add status field
- `app/(dashboard)/page.tsx` - Build real dashboard
- `components/workspace/overview-tab.tsx` - Use checklist engine
- `components/workspace/next-steps-panel.tsx` - Use missing items function

### Success Criteria

- [ ] Pipeline page shows clients grouped by status
- [ ] Can drag clients between columns
- [ ] Client cards show setup completion %
- [ ] Client cards show top missing items
- [ ] Dashboard shows "At Risk" clients
- [ ] Dashboard shows pipeline counts
- [ ] Overview tab checklist is dynamic based on enabled modules

---

## **PHASE 4: Enhanced Social Module**

**Goal**: Upgrade the Social module with better content UX, strategy tagging, and integrated Ideas.

### 4.1 Connected Accounts Section (Enhanced)

**Current**: Basic platform cards in Settings page
**New**: Client-scoped account management in Social tab

**Social Tab → Connected Accounts**:

```
Connected Accounts (3)

┌────────────────────────────────────────────────────┐
│ [IG Icon] Instagram                          ✓     │
│ @username • 1,245 followers                        │
│ Last synced: 2 hours ago                           │
│ [Sync Now] [Disconnect]                            │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ [FB Icon] Facebook Page                      ✓     │
│ Page Name • 3,421 followers                        │
│ Last synced: 2 hours ago                           │
│ [Sync Now] [Disconnect]                            │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ [TikTok Icon] TikTok                         ✗     │
│ Not connected                                      │
│ [Connect TikTok] (disabled - "Coming Soon")        │
└────────────────────────────────────────────────────┘

+ Connect Another Account
```

**Features**:

- Shows accounts linked to current client (via clientId)
- "Last synced" timestamp from most recent content.publishedAt
- Manual sync button (calls existing Meta sync endpoint)
- Shows follower count from Meta API (if available in rawData)

### 4.2 Content Feed (Upgraded)

**Current**: Simple grid with thumbnails + metrics
**New**: Filterable, sortable, taggable content gallery

**Social Tab → Content Feed**:

**Filters Bar**:

- Platform filter: All / Instagram / Facebook / TikTok / YouTube
- Date range: Last 7 days / 30 days / 90 days / All time
- Sort by: Recent / Views / Engagement / Likes
- **Strategy Tags filter** (multi-select): Shows tags in use

**Content Grid** (keep existing card design):

- Thumbnail
- Platform badge
- Metrics (views, likes, comments, shares)
- **NEW: Strategy tags chips** (shown on hover or below metrics)
- Click → Opens content detail modal

**Content Detail Modal**:

- Full-size media preview
- Caption/description
- All metrics
- Published date
- **Strategy Tags Manager**:
  - Shows current tags
  - Add/remove tags via multi-select dropdown
  - Suggested tags based on caption analysis (optional future)

### 4.3 Strategy Tagging System

**Add to `content` table**:

- `strategyTags: string[]` (array field)

**Migration**:

- Default to empty array for existing content

**Tag Categories** (suggested, not enforced):

- **Hook Types**: "Shock stat", "Question", "Story", "Relatability"
- **Content Series**: "Quick tips", "Behind-the-scenes", "Client wins", "Tutorials"
- **CTA Types**: "Book call", "Visit website", "Follow for more", "DM us"
- **Topic/Theme**: Custom tags per industry

**Tag Management**:

- Stored as simple string array (flexible, no predefined schema)
- UI shows suggested tags based on what's been used before (client-scoped)
- Autocomplete input for adding tags

**Component**:

- `components/social/content-tag-manager.tsx` - Tag UI component
- Server action: `updateContentTags(contentId, tags: string[])`

### 4.4 Ideas System (Integrated into Social Module)

**Current**: Empty Ideas page, unused schema
**New**: "Content Ideas" section in Social tab, client-scoped

**Social Tab → Content Ideas**:

```
Content Ideas (Based on Your Performance)

Filter: [All] [Trending ✓] [High Confidence]

┌────────────────────────────────────────────────────┐
│ 🔥 Trending Idea                        Confidence: 87% │
│ "Quick Tips Series with Shock Stats"                │
│                                                      │
│ Why this works:                                      │
│ • Your top 5 posts all used shock stats in hooks    │
│ • "Quick tips" tag has 2.3x avg engagement           │
│ • Consistent posting (3x/week) drives views         │
│                                                      │
│ Based on: 5 top posts | [View Posts]                │
│ [Create Content] [Dismiss]                           │
└────────────────────────────────────────────────────┘
```

**Ideas Generation** (can be simple/manual at first):

- Analyze content with strategy tags
- Find patterns: which tags correlate with high views/engagement?
- Group top-performing content by tag combinations
- Generate "idea" = combination of successful tags + reason

**Update `ideas` schema**:

- Add `clientId: string` (FK → clients.id, CASCADE)
- Keep existing fields (title, description, confidence, basedOnVideoIds, isTrending)
- Change: basedOnVideoIds → array of content.id references

**Component**:

- `components/social/ideas-list.tsx` - Ideas display
- `components/social/idea-card.tsx` - Single idea card
- Server action: `generateIdeas(clientId)` - Analyzes content, creates ideas
- Initially can be manual: "Run Analysis" button that you trigger

### 4.5 Basic Analytics (Simple Charts)

**Social Tab → Analytics** (sub-section, collapsible):

**Metrics Row** (last 30 days):

- Total Posts: 24
- Total Views: 45.2K
- Avg Engagement: 3.2%
- Top Post: [thumbnail] 12.3K views

**Simple Charts** (use Recharts):

- **Posting Frequency**: Bar chart by week
- **Engagement by Platform**: Pie chart (IG vs FB views)
- **Top 5 Posts**: Horizontal bar chart (sorted by views)

**No complex analytics yet** - just basic summary stats.

### Files to Create/Modify

**CREATE**:

- `components/social/connected-accounts-section.tsx` - Enhanced accounts UI
- `components/social/content-feed.tsx` - Filterable content grid
- `components/social/content-filters.tsx` - Filter/sort controls
- `components/social/content-detail-modal.tsx` - Content popup
- `components/social/content-tag-manager.tsx` - Tag editing UI
- `components/social/ideas-list.tsx` - Ideas display
- `components/social/idea-card.tsx` - Single idea card
- `components/social/analytics-section.tsx` - Basic charts
- `lib/actions/content.ts` - Add updateContentTags()
- `lib/actions/ideas.ts` - Add generateIdeas()
- `migrations/0006_add_content_strategy_tags.sql` - Add strategyTags column
- `migrations/0007_add_client_to_ideas.sql` - Add clientId to ideas

**MODIFY**:

- `lib/db/schema/content.ts` - Add strategyTags field
- `lib/db/schema/ideas.ts` - Add clientId, update basedOnVideoIds type
- `components/workspace/social-tab.tsx` - Integrate all new sections
- `app/(dashboard)/ideas/page.tsx` - Remove or redirect to workspace

### Success Criteria

- [ ] Social tab shows client-scoped connected accounts
- [ ] Can sync content from Social tab (not just Settings)
- [ ] Content feed has platform/date/tag filters
- [ ] Can click content → open detail modal
- [ ] Can add/remove strategy tags on content
- [ ] Ideas section shows analysis-based suggestions
- [ ] Basic analytics charts display correctly
- [ ] Ideas are client-scoped (not global)

---

## **PHASE 5: Simple SEO Module (MVP)**

**Goal**: Basic SEO settings storage - website URL, keywords, locations. No blog queue yet.

### 5.1 SEO Tab UI

**When SEO module is enabled**, show SEO tab with:

```
SEO Settings

┌────────────────────────────────────────────────────┐
│ Website Details                                     │
│                                                     │
│ Website URL                                         │
│ [https://example.com________________]              │
│                                                     │
│ Meta Title (optional)                               │
│ [Best Plumbing Services in NYC_____]                │
│                                                     │
│ Meta Description (optional)                         │
│ [Textarea for description__________]                │
│                                                     │
│ [Save]                                              │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Target Keywords                                     │
│                                                     │
│ [plumber nyc] [emergency plumber] [+ Add]           │
│                                                     │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Target Locations                                    │
│                                                     │
│ [New York, NY] [Brooklyn, NY] [+ Add]               │
│                                                     │
└────────────────────────────────────────────────────┘

Coming Soon:
• Blog Post Queue
• Google My Business Integration
• Site Health Monitoring
```

**Form handling**:

- Auto-save on blur or explicit "Save" button
- Stores in `client_seo_settings` table (one record per client)
- Tags input component for keywords and locations

### 5.2 SEO Settings Data Flow

**Server Actions**:

- `updateSeoSettings(clientId, data)` - Upsert SEO settings
- `getSeoSettings(clientId)` - Fetch settings for form

**Component**:

- `components/seo/seo-settings-form.tsx` - Main settings form
- `components/seo/tags-input.tsx` - Reusable tags input (for keywords/locations)

### 5.3 SEO Checklist Integration

**Update setup checklist** (from Phase 3):

- ☐ Website URL set
- ☐ At least 1 target keyword
- ☐ At least 1 target location

**Next Steps panel** shows these if SEO module enabled but incomplete.

### 5.4 Optional: Quick Win - Site Health Snapshot

**If time allows** (totally optional):

**SEO Tab → Site Health** (bottom section):

```
Site Health (Last Checked: 2 days ago)

Mobile Score: 78 / 100  🟡
Desktop Score: 92 / 100 🟢

Core Web Vitals: Good

[Run PageSpeed Test]
```

**Implementation**:

- Use PageSpeed Insights API (free, no key needed)
- Store last result in `client_seo_settings.config` jsonb
- Manual "Run Test" button (not automatic)
- Display simple scores + pass/fail status

**If this is too complex**: Skip entirely, add in later phase.

### Files to Create/Modify

**CREATE**:

- `components/seo/seo-settings-form.tsx` - Main SEO form
- `components/seo/tags-input.tsx` - Tags input component
- `components/seo/site-health-card.tsx` - Optional site health display
- `lib/actions/seo.ts` - SEO settings CRUD actions
- `lib/data/data.seo.ts` - SEO settings queries

**MODIFY**:

- `components/workspace/seo-tab.tsx` - Integrate settings form
- `lib/utils/setup-checklist.ts` - Add SEO checklist rules

### Success Criteria

- [ ] SEO tab shows when seo module is enabled
- [ ] Can enter website URL, keywords, locations
- [ ] Settings save to client_seo_settings table
- [ ] SEO checklist items appear in Overview tab
- [ ] Next Steps panel shows SEO missing items

---

## **PHASE 6: Settings Page Refactor + Placeholder Modules**

**Goal**: Move account connections to workspace, update Settings to be user-level, add placeholder modules.

### 6.1 Settings Page (User-Level)

**Remove from Settings**:

- ❌ Platform connection cards (move to Social module)

**Keep/Add to Settings**:

- User preferences (theme, notifications - future)
- Account settings (email, password - via Clerk)
- Billing (future)
- Team members (future)

**For now, minimal Settings**:

```
Settings

Profile
- Name: [User's name]
- Email: user@example.com
- [Manage in Clerk] link

Preferences
- Theme: Light / Dark / System (future)
- Email notifications: On / Off (future)

Danger Zone
- [Delete Account]
```

### 6.2 Platform Connections → Social Module

**Move OAuth connection flow** to Social tab:

**Social Tab → Connected Accounts → Connect Button**:

- Click "Connect Instagram" → Opens OAuth flow
- On success → Redirects back to workspace Social tab
- Linked to current clientId

**Update OAuth callback**:

- `app/api/oauth/meta/callback/route.ts`
- Accept `clientId` in state parameter
- Create connectedAccount with clientId link

### 6.3 Placeholder Modules UI

**AI Receptionist Module** (when enabled):

```
AI Receptionist

🤖 Coming Soon

This module will handle:
• Incoming call automation
• Appointment booking
• FAQ responses
• Call transcription and analytics

Want early access? [Contact us]

[Disable Module]
```

**Automations Module** (when enabled):

```
Automations

⚡ Coming Soon

This module will help you:
• Auto-post content to social media
• Schedule email campaigns
• Trigger actions based on client milestones
• Create workflow templates

Want early access? [Contact us]

[Disable Module]
```

**Assets Module** (when enabled):

```
Brand Assets

📁 Coming Soon

Upload and manage:
• Logo files (PNG, SVG)
• Brand colors palette
• Typography guidelines
• Tone of voice notes
• Approved photos library

Powered by Cloudinary

[Disable Module]
```

**Component**:

- `components/workspace/placeholder-module-tab.tsx` - Generic placeholder
- Pass module name + description as props

### Files to Create/Modify

**MODIFY**:

- `app/(dashboard)/settings/page.tsx` - Simplify to user-level only
- `components/settings/platform-card.tsx` - Remove or move to Social module
- `app/api/oauth/meta/callback/route.ts` - Use projectId instead of clientId
- `components/social/connected-accounts-section.tsx` - Add OAuth trigger buttons
- `components/workspace/placeholder-module-tab.tsx` - Render placeholder UI

### Success Criteria

- [ ] Settings page is user-focused (no platform connections)
- [ ] Can connect Instagram/Facebook from Social tab
- [ ] OAuth flow creates account linked to clientId
- [ ] Placeholder modules show "Coming Soon" with descriptions
- [ ] Can enable/disable placeholder modules

---

## **PHASE 7: Polish + Cleanup**

**Goal**: Final touches, remove deprecated routes, improve UX consistency.

### 7.1 Route Cleanup

**Remove/Redirect deprecated routes**:

- `/content` → Redirect to `/workspace/[firstClientId]` or Dashboard
- `/ideas` → Remove (now in Social tab)
- `/import` → Move to Settings or remove (manual import less needed with OAuth)

### 7.2 Sidebar State Persistence

**Save selected client** to localStorage or URL state:

- When you select a client, update URL: `/workspace/[clientId]`
- On app load, restore last selected client

### 7.3 Empty States

**Add empty states** everywhere:

- No clients → "Create your first client" card
- No modules enabled → "Enable a module to see data here"
- No content synced → "Connect an account to see content"
- No ideas generated → "Run analysis to discover trending ideas"

**Component**:

- `components/ui/empty-state.tsx` - Reusable empty state component

### 7.4 Loading States

**Add skeleton loaders** for async data:

- Client list loading
- Content feed loading
- Analytics loading
- Use `components/ui/skeleton.tsx` from shadcn/ui

### 7.5 Error Handling

**Consistent error handling**:

- OAuth failures → Show toast + log error
- API errors → Display error message + retry option
- Network failures → Offline banner

### 7.6 Mobile Responsiveness

**Test and fix mobile layouts**:

- Sidebar collapse on mobile
- Workspace header stacks vertically
- Content grid responsive (1 col on mobile, 2 on tablet, 3+ on desktop)
- Pipeline board horizontal scroll on mobile

### 7.7 Accessibility

**A11y improvements**:

- Keyboard navigation for sidebar
- Focus management in modals
- ARIA labels on icon buttons
- Proper heading hierarchy

### Files to Create/Modify

**CREATE**:

- `components/ui/empty-state.tsx` - Reusable empty state
- `lib/hooks/use-workspace-state.ts` - Persist client/project selection

**MODIFY**:

- `app/(dashboard)/content/page.tsx` - Redirect logic
- `app/(dashboard)/ideas/page.tsx` - Remove or redirect
- `app/(dashboard)/import/page.tsx` - Remove or relocate
- `middleware.ts` - Add route redirects if needed
- All major components - Add loading/error/empty states

### Success Criteria

- [ ] No broken links or deprecated routes
- [ ] Selected client persists across page loads
- [ ] Empty states guide users to take action
- [ ] Loading states prevent layout shift
- [ ] Errors are user-friendly with recovery options
- [ ] Mobile layout works smoothly
- [ ] Keyboard navigation functional

---

## Critical Files Reference

### Database Schema Files

- `lib/db/schema/clients.ts` - Client schema with status and enabledModules
- `lib/db/schema/platforms.ts` - Connected accounts (clientId reference)
- `lib/db/schema/content.ts` - Content/posts (add strategyTags - Phase 4)
- `lib/db/schema/ideas.ts` - Ideas (add clientId - Phase 4)
- `lib/db/schema/client-seo-settings.ts` - SEO settings (1:1 with client)
- `lib/db/schema/index.ts` - Schema exports

### Data Access Layer

- `lib/data/data.clients.ts` - Client queries
- `lib/data/data.accounts.ts` - Account queries (client-scoped)
- `lib/data/data.content.ts` - Content queries
- `lib/data/data.seo.ts` - SEO settings queries

### Actions Layer

- `lib/actions/clients.ts` - Client CRUD + status update
- `lib/actions/content.ts` - Content actions (strategy tags - Phase 4)
- `lib/actions/seo.ts` - SEO settings actions

### UI Components

- `components/dashboard/app-sidebar.tsx` - Client list sidebar
- `app/(dashboard)/page.tsx` - Dashboard with at-risk clients
- `app/(dashboard)/settings/page.tsx` - User settings
- `app/(workspace)/workspace/[clientId]/page.tsx` - Client workspace
- `components/workspace/*` - Workspace components
- `components/dashboard/*` - Dashboard components
- `components/social/*` - Social module
- `components/seo/*` - SEO module
- `components/ai-receptionist/*` - AI Receptionist module (future)

### API Routes

- `app/api/oauth/meta/callback/route.ts` - OAuth with clientId

### Utilities

- `lib/utils/setup-checklist.ts` - Dynamic checklist engine
- `lib/hooks/use-workspace-state.ts` - State persistence (Phase 7)

---

## Testing Checklist

### Per Phase Testing

**Phase 1-2** (COMPLETE):

- [x] Client workspace loads
- [x] Sidebar navigation works
- [x] Modules appear/disappear correctly
- [x] Module enablement dialog works

**Checklist Engine** (COMPLETE):

- [x] Checklist shows correct items dynamically
- [x] Dashboard displays at-risk clients
- [x] Client status updates persist
- [x] Workspace header shows next steps

**Phase 4**:

- [ ] Content filters work
- [ ] Can add/remove tags
- [ ] Ideas generate correctly
- [ ] Analytics charts render

**Phase 5**:

- [ ] SEO settings save
- [ ] Tags input works
- [ ] Checklist updates

**Phase 6**:

- [ ] OAuth from workspace works
- [ ] Settings page simplified
- [ ] Placeholders render

**Phase 7**:

- [ ] No 404s on old routes
- [ ] Empty states show
- [ ] Mobile responsive
- [ ] Keyboard nav works

---

## Post-Implementation Roadmap

### Future Enhancements (Not in this plan)

**Phase 8+**:

- TikTok & YouTube OAuth implementation
- Blog queue & publishing workflow
- Google My Business integration
- PageSpeed Insights automation
- AI Receptionist module (actual implementation)
- Automations module (workflow builder)
- Assets module (Cloudinary integration)
- Content calendar & scheduling
- Team collaboration features
- Client portal (client-facing dashboard)
- Reporting & export features
- Email campaign module

---

## Key Architectural Decisions

### 1. Client-Centric (No Projects Layer)

**Why**: Simpler architecture for agencies that typically manage one engagement per client. Modules are enabled directly on clients via `enabledModules` array.

### 2. Array for Modules (Not Junction Table)

**Why**: Simple `enabledModules` text array on clients table. Easy to query, no extra joins, works well for small module counts.

### 3. Ideas in Social Module (Not Global)

**Why**: Ideas should be contextual to what's working for that client, not across all clients.

### 4. Simple SEO First (No Blog Queue)

**Why**: Proves module system and provides value without complex blog workflow. Blog queue is Phase 8+.

### 5. Real Placeholders (Not Hidden)

**Why**: Shows roadmap to clients, lets you enable modules when ready, demonstrates full platform vision.

### 6. Dynamic Setup Checklist

**Why**: Checklist engine queries real data to show what's complete/missing. Powers dashboard, workspace header, and pipeline cards.

---

## Success Metrics

### Phase 1-2 Success: ✅

- Can create client → enable modules → see workspace

### Phase 3 Success: ✅

- Can manage client pipeline visually
- Dashboard provides at-a-glance status

### Phase 4 Success:

- Social module feels feature-complete
- Strategy tagging drives insights

### Phase 5 Success:

- SEO module provides foundational value

### Phase 6-7 Success:

- App feels polished and professional
- No confusing or broken UX

### Overall Success:

- **Client-first UX achieved**: Every view is scoped to a client
- **Module system works**: Easy to enable/disable services per client
- **Scalable foundation**: Can add TikTok, YouTube, Blog Queue, etc. without refactoring
- **Checklist-driven**: Users always know what's missing and what to do next

---

## End of Plan

This plan transforms SM Pro from a basic content aggregator into a professional agency management platform with a client-first UX model and scalable module architecture. Each phase builds on the previous, allowing incremental rollout and testing.
