# Client Intelligence Backbone Plan (SEO-first v1)

## Why This Plan Exists
We need one canonical client context that all modules can share. Today, the SEO tab's "Analyze Website" output is useful but too channel-specific to act as a long-term foundation for social, blog automation, and future paid modules.

## Current Program Context
- Product stage: pre-launch.
- Active users: `0`.
- Existing database records are non-production and may be deleted/reset.
- Implication: we optimize for clean architecture and fast iteration, not backward-compatible data migration.

## Decision Summary
- Build a universal backbone first.
- Run deep channel analysis as modular enrichments.
- Lock v1 scope to: backbone + SEO enrichment only.

## Goals
- Define a reusable client intelligence baseline created at client onboarding.
- Standardize provenance and freshness metadata across all stored records.
- Define a shared output contract for humans and LLM workflows.
- Support immediate SEO/blog outcomes without blocking on other channels.

## Non-Goals (v1)
- Building social, paid, or other deep channel enrichments.
- Full multi-channel attribution modeling.
- UI redesign beyond documenting required data contracts.

## v1 Scope Lock
### In Scope
- Universal Initial Analysis pipeline and schema.
- Canonical context object and module append contract.
- SEO enrichment module integration.

### Out of Scope
- Social enrichment depth (cadence benchmarks, competitor social intelligence).
- Paid media enrichment.
- Cross-channel scoring beyond SEO-driven decisions.

## Phase 0: Inventory Current State (Expanded)
### Objective
- Establish a factual baseline of what the current "Analyze Website" flow captures today.
- Separate reusable client-baseline fields from SEO-only enrichment fields.
- Produce a gap register before adding new ingestion work.
- Treat this as system/contract analysis, not legacy data migration.

### Current "Analyze Website" Capture (As Implemented)
- Scraping providers: `jina` (Jina Reader) or `firecrawl` (single-page scrape or multi-page crawl).
- AI extraction output: `keywords`, `location`, `industry`, `metaTitle`, `metaDescription`, and optional `pagesSummary` (multi-page only).
- Persisted SEO settings fields:
  - `websiteUrl`
  - `targetKeywords`
  - `targetLocations`
  - `industry`
  - `metaTitle`
  - `metaDescription`
  - `analyzedAt`
  - `analysisProvider`
- Not persisted from crawl/analysis:
  - Raw scraped content
  - URL discovery/crawl inventory
  - `pagesSummary`/`keyPages`
  - Per-record confidence/staleness metadata

### Is Jina/Firecrawl "Good" for Universal Client Analysis?
- Good for: fast content extraction to bootstrap keyword/industry/location inference.
- Not sufficient for universal backbone quality by itself:
  - Output is unstructured text plus AI inference, not a verified client profile.
  - No durable storage of crawl inventory or raw evidence for audit/replay.
  - No first-party performance integrations (GSC/GA4) in this flow.
- Decision: keep providers as ingestion inputs, but do not treat them as the universal backbone source of truth.

### What "Map Existing Fields" Means
Map each current field to one owner and one canonical destination in the shared context.

Notes for pre-launch state:
- This mapping is not for preserving old rows.
- This mapping is for preserving product behavior while we replace the schema.
- We can delete/reset current data, but we still need to map current app inputs/outputs to the new contract so features do not regress.

| Current Field | Current Source | Persisted Today | Proposed Owner | Proposed Canonical Path |
| --- | --- | --- | --- | --- |
| `websiteUrl` | user input / analysis flow | yes | backbone | `backbone.digitalFootprint.primaryWebsite` |
| `targetKeywords` | AI suggestion + user edits | yes | seo module | `modules.seo.seeds.keywords` |
| `targetLocations` | AI suggestion + user edits | yes | backbone | `backbone.businessProfile.locationsServed` |
| `industry` | AI inference + user edits | yes | backbone | `backbone.businessProfile.industry` |
| `metaTitle` | AI suggestion | yes | seo module | `modules.seo.onPageSuggestions.metaTitle` |
| `metaDescription` | AI suggestion | yes | seo module | `modules.seo.onPageSuggestions.metaDescription` |
| `analyzedAt` | save timestamp | yes | seo module | `modules.seo.provenance.updatedAt` |
| `analysisProvider` | provider toggle | yes | seo module | `modules.seo.provenance.source` |
| `pagesSummary.keyPages` | multi-page AI response | no | seo module | `modules.seo.discovery.keyPages` |

### What "Flag Gaps" Means
For each required v1 backbone field, mark `present`, `partial`, or `missing`, then assign impact.

Gap severity:
- `P0`: blocks backbone contract or downstream automation quality.
- `P1`: important for quality/confidence, not immediately blocking.
- `P2`: useful enhancement after v1 stabilization.

Initial gap register (from current implementation):
- `P0` missing: personas/funnel intent priorities.
- `P0` missing: integration readiness + consent state (GSC/GA4).
- `P0` missing: canonical provenance model (`source`, `updatedAt`, `confidence`, `staleAt`) at record level.
- `P0` missing: durable crawl inventory and raw evidence storage.
- `P0` partial: business profile fields (industry/location inferred, but differentiators/constraints absent).
- `P2` missing: social footprint baseline normalization.

Interpretation of gaps in this pre-launch phase:
- Gap fields are the fields we need to introduce in the new universal backbone schema and related module schemas.
- We are not filling historical data; we are defining what must exist before v1 is considered complete.

### Phase 0 Deliverable
- A signed-off field ownership matrix (`backbone` vs `seo module`).
- A prioritized gap register (`P0/P1/P2`) with implementation owner and target phase.

### Phase 0 Outputs (Completed)
Status: `completed` for planning/design on `2026-02-19`.

#### Signed-Off Field Ownership Matrix (v1)
| Field | Owner | Keep/Replace | Canonical Path | Notes |
| --- | --- | --- | --- | --- |
| `websiteUrl` | backbone | keep | `backbone.digitalFootprint.primaryWebsite` | Required by setup + generation flows. |
| `targetKeywords` | seo module | replace with module seeds | `modules.seo.seeds.keywords` | SEO-owned input for clustering/briefs. |
| `targetLocations` | backbone | keep (normalize) | `backbone.businessProfile.locationsServed` | Shared by SEO and future local/social workflows. |
| `industry` | backbone | keep (normalize) | `backbone.businessProfile.industry` | Core business context, not SEO-only. |
| `metaTitle` | seo module | keep as suggestion | `modules.seo.onPageSuggestions.metaTitle` | Derived recommendation, not backbone truth. |
| `metaDescription` | seo module | keep as suggestion | `modules.seo.onPageSuggestions.metaDescription` | Derived recommendation, not backbone truth. |
| `analyzedAt` | seo module | replace with canonical provenance | `modules.seo.provenance.updatedAt` | Will align to canonical provenance model. |
| `analysisProvider` | seo module | replace with canonical provenance | `modules.seo.provenance.source` | Provider becomes standardized `source`. |
| `pagesSummary.keyPages` | seo module | add persistence | `modules.seo.discovery.keyPages` | Currently returned but not persisted. |

#### Prioritized Gap Register with Owner + Target Phase
| Gap | Severity | Owner | Target Phase | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Personas + funnel intent priorities absent | `P0` | Backbone | Backbone Phase 1 | `backbone.audience` fields exist and are validated. |
| Integration readiness + consent state absent | `P0` | Backbone | Backbone Phase 1 | `backbone.integrations` status + consent fields exist per integration. |
| Canonical provenance model missing | `P0` | Backbone + SEO | Backbone Phase 1 + SEO Phase 3 | `source`, `updatedAt`, `confidence`, `staleAt` present on backbone + SEO records. |
| Crawl inventory + raw evidence missing | `P0` | SEO Module | SEO Phase 3 | Crawl runs/pages/evidence references are persisted and queryable. |
| Business profile incomplete (services, differentiators, constraints) | `P0` | Backbone | Backbone Phase 1 | `backbone.businessProfile` includes required v1 fields. |
| Social footprint baseline normalization missing | `P2` | Backbone | Backbone Phase 2+ | Social presence shape defined; deep enrichment remains out of scope. |

#### Phase 0 Definition of Done Checklist
- [x] Current Analyze Website capture inventoried from implementation.
- [x] Ownership matrix signed off (`backbone` vs `seo module`).
- [x] Gap register prioritized (`P0/P1/P2`) with owner + target phase.
- [x] v1 schema target definitions documented for all `P0` items.

### Phase 0 Implementation Definitions (v1)
These definitions are the minimum acceptable schema targets for Phase 0 completion.

#### Personas + Funnel Intent Priorities (`backbone.audience`)
- `primaryPersonas`: array of persona labels (e.g., `"homeowner"`, `"operations_manager"`).
- `personaPainPoints`: map of persona to top pain points.
- `funnelPriority`: one of `awareness | consideration | conversion`.
- `intentPriority`: one of `informational | transactional | mixed`.

#### Integration Readiness + Consent State (`backbone.integrations`)
For each integration (`gsc`, `ga4`, later others):
- `status`: `not_connected | connected | error | needs_reauth`.
- `lastCheckedAt`: timestamp.
- `lastSuccessfulSyncAt`: timestamp or null.
- `consentGranted`: boolean.
- `consentScope`: string array of approved data scopes.
- `consentUpdatedAt`: timestamp or null.

#### Canonical Provenance Model (required on backbone + module records)
- `source`: provider/system name (`manual`, `jina`, `firecrawl`, `gsc`, `ga4`, etc.).
- `updatedAt`: last successful update time.
- `confidence`: normalized score (`0-1`) or tier (must be standardized globally).
- `staleAt`: staleness deadline after which consumers should treat data as outdated.

#### Crawl Inventory + Raw Evidence (`modules.seo.discovery`)
- `crawlRuns`: root URL, provider, startedAt, finishedAt, discoveredCount, scrapedCount, analyzedCount, errorSummary.
- `crawlPages`: URL-level records with `discoveredAt`, `scrapedAt`, `analyzedAt`, `status`, `error`, and content hash.
- `rawEvidenceRefs`: references to stored raw artifacts (scraped markdown, fetch logs, API payload snapshots).

#### Business Profile Fields (`backbone.businessProfile`)
- `industry`: normalized category.
- `services`: offered services/products array.
- `differentiators`: why the client is different/better.
- `locationsServed`: city/region/service area list.
- `constraints`: legal/compliance/topic restrictions and disallowed claims.

## Phase 1: Universal Initial Analysis (On Client Creation)
### 1) Business Profile + Constraints
- Offerings/services, differentiators, service areas.
- Brand/legal/compliance constraints.
- Approved and disallowed content categories.

### 2) Audience + Intent Priorities
- Primary personas.
- Funnel emphasis (awareness, consideration, conversion).
- Intent split targets (informational vs transactional).

### 3) Digital Footprint Baseline
- Primary website and core domains/subdomains.
- Existing content inventory summary (high-level).
- Connected social profiles (presence only, not deep analytics).

### 4) Integration Readiness + Consent
- Integration status for GSC, GA4, and other eligible data sources.
- Consent/scoping metadata for client-authorized integrations.

### 5) Provenance + Freshness Metadata (Required Everywhere)
- `source`: origin system/provider.
- `updatedAt`: last successful refresh timestamp.
- `confidence`: reliability score or tier.
- `staleAt`: timestamp when data should be treated as stale.

## Phase 2: Canonical Context Object Contract
- Define one shared object for all downstream automations.
- Backbone owns base fields; modules append derived insights.
- No disconnected module-specific "final contexts."

Example shape:

```ts
interface ClientIntelligenceContext {
  clientId: string;
  backbone: {
    businessProfile: unknown;
    audience: unknown;
    digitalFootprint: unknown;
    integrations: unknown;
    provenance: {
      source: string;
      updatedAt: string;
      confidence: number;
      staleAt: string;
    };
  };
  modules: {
    seo?: {
      inputsVersion: string;
      derivedInsights: unknown;
      updatedAt: string;
      confidence: number;
      staleAt: string;
    };
  };
}
```

## Phase 3: Module Interface Contract
Each module must declare:
- Required backbone inputs.
- External sources used.
- Refresh cadence/SLA.
- Derived outputs written back to shared context.
- Confidence and staleness rules.

## Phase 4: Execution Model
- Run universal analysis once at client creation.
- Re-run universal analysis only on explicit triggers (major profile/site/integration changes).
- Run enrichments on demand and on scheduled refreshes.
- Start with SEO enrichment; defer others until schema stability is proven.

## Phase 5: Freshness Policy
- Backbone: slower cadence, event-driven updates, strict provenance.
- SEO module: faster cadence based on ranking/performance volatility.
- Every downstream action must check staleness before execution.

## Phase 6: Deliverables
- Canonical backbone schema proposal (Convex tables + derived view strategy).
- Shared context contract used by LLM and human workflows.
- Ownership map: backbone fields vs SEO-owned fields.
- v1 rollout checklist and freshness policy.

## Open Questions
- What confidence scale should be standardized across providers?
- Do we define a single org-wide freshness SLA or tiered SLA by client segment?
- Which fields are mandatory before allowing SEO enrichment execution?
