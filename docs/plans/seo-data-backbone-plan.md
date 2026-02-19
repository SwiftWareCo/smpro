# SEO Enrichment Plan (Client Intelligence Backbone v1)

## Why This Plan Exists
This document defines the SEO module that enriches the Client Intelligence Backbone. It keeps the existing SEO depth (keywords, SERP, GSC/GA4, content gaps) while aligning to a shared cross-module architecture.

## Position in Architecture
- Backbone plan: `docs/plans/client-intelligence-backbone-plan.md`
- This plan: SEO-specific enrichment only.

## Module Contract
### Consumes from Backbone
- Business profile (services, differentiators, constraints).
- Audience and intent priorities.
- Location/service-area context.
- Integration readiness and consent status.
- Baseline site footprint.

### Writes to Shared Context
- SEO raw datasets (where needed for auditability).
- SEO derived insights for planning and automation.
- Provenance metadata per dataset: `source`, `updatedAt`, `confidence`, `staleAt`.

## Goals
- Build a complete, up-to-date SEO enrichment layer for blog planning and client recommendations.
- Preserve source traceability and freshness controls.
- Output ranked SEO actions and structured topic briefs.

## Non-Goals (v1)
- Defining universal client baseline fields (owned by backbone plan).
- Implementing social/paid module enrichments.
- Building full attribution models.

## Phase 0: Inventory Current SEO State
- Identify what the SEO tab "Analyze Website" currently stores.
- Map fields to: backbone-owned vs SEO-owned.
- Identify missing SEO module fields and required Convex storage.

## Phase 1: Define Required SEO Enrichment Data
### 1) Website + Technical SEO (Site Health)
- Crawl status, indexability, sitemap/robots, canonicalization.
- Core Web Vitals/performance and mobile usability.
- Broken links, redirect chains, status codes.
- Schema coverage, metadata completeness, duplicate content.

### 2) Content Inventory + On-Site Signals
- Page catalog (URL, title, H1, word count, topic classification).
- Internal links (incoming/outgoing), anchor text.
- Content freshness (last modified, update cadence).
- Ranking pages and mapped target terms (where known).

### 3) Keyword Universe
- Seed keywords from backbone business profile + site topics.
- Metrics: volume, difficulty, CPC, intent, SERP features.
- Long-tail variants and question queries.
- Cluster/grouping for topic hubs.

### 4) Demand + Trends
- Trend direction and seasonality by keyword/topic.
- Geographic demand slices aligned to client locations.
- Related and breakout queries.

### 5) SERP + Competition Intelligence
- Top competitors by keyword cluster.
- Content type mix in SERP.
- SERP feature presence (FAQ, video, local pack, etc.).
- Estimated content length/freshness and backlink proxy signals.

### 6) Performance Analytics (First-Party)
- GSC: impressions, clicks, CTR, average position by query/page.
- GA4: engagement metrics at page/content level.
- Conversion/lead signals when available.

### 7) Local SEO Context (If Applicable)
- Local pack ranking snapshots.
- GBP/Maps signals where available.
- City/region keyword variants.

## Phase 2: Data Sources + Integrations
- Site crawl provider (in-house or third-party API).
- Google Search Console API.
- Google Trends.
- Keyword database API.
- SERP API/scraping provider.
- GA4/analytics provider.

## Phase 3: Data Model + Storage
- Normalize SEO module tables by dataset type.
- Store raw + derived SEO records.
- Include `source`, `updatedAt`, `confidence`, `staleAt` on records.
- Version key derived datasets to monitor trend/ranking movement.
- Publish SEO module outputs back into canonical client context.

## Phase 4: Freshness + Scheduling (Convex Crons)
- Daily: GSC query/page performance, priority SERP snapshots.
- Weekly: keyword expansion and trends refresh.
- Monthly: full crawl and site-health refresh.
- Record staleness and block low-confidence stale outputs from automation.

## Phase 5: Derived Outputs for Blog + Recommendations
- Topic brief payload:
  - Primary keyword/cluster, intent, volume, difficulty.
  - Trend direction and seasonality window.
  - SERP insights (content format, expected depth, must-have sections).
  - Competitor gaps and differentiators.
  - Internal link targets and CTA suggestions.
- Prioritized roadmap payload:
  - Impact score.
  - Effort score.
  - Business alignment score.
  - Freshness/confidence gates.

## Phase 6: SEO Decision Engine Inputs
- Demand score (volume + trend).
- Feasibility score (difficulty + site strength proxies).
- Business value score (service alignment + conversion potential).
- Recency score (freshness/staleness).
- Output: ranked SEO action list.

## v1 Guardrails
- SEO is the only deep enrichment module in v1.
- Social/paid enrichment requests are deferred until backbone schema stabilizes.
- Any new SEO field must map to explicit downstream decisions or outputs.

## Open Questions
- Which keyword/SERP/trend providers should be standardized?
- Per-client keys vs centralized org keys?
- Freshness SLA by tier (enterprise vs SMB)?
- Analytics consent scope and storage model?

## Deliverables
- SEO data requirements checklist mapped to SEO tab behavior.
- Convex schema proposal for SEO enrichment.
- Cron schedule and freshness policy for SEO datasets.
- SEO topic brief template and action ranking payload spec.
