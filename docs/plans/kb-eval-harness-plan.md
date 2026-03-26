# Knowledge Base Eval Harness and Hallucination Guardrails Plan

Status: Draft  
Last updated: 2026-03-25  
Owner: KB module

## 1. Goals

1. Make KB quality measurable before model/retrieval changes.
2. Detect regressions in retrieval and answer grounding early.
3. Provide a clear UI for understanding failures and trends.
4. Add a minimal hard guardrail that reduces hallucinations when retrieval evidence is weak.

## 2. Scope

In scope:
1. Eval dataset, run tracking, per-case result storage.
2. Reusable pipeline path so eval uses production retrieval/answer logic.
3. Metrics and pass/fail thresholds.
4. Admin-facing results UI with trends and failure drill-down.
5. Minimal orchestration guardrail based on retrieval confidence/evidence.

Out of scope (for this phase):
1. Folder/document scoped retrieval UX changes.
2. Complex model migration framework with versioned dual-index rollouts.
3. Automated external benchmark integrations.

## 3. Current State Summary

1. KB questions are handled by `kbChat.startChat` and scheduled to `kbAgent.respond`.
2. Retrieval currently runs as an agent tool calling hybrid `ragSearch.search`.
3. Agent instructions ask for retrieval first, but tool usage is instruction-driven rather than hard-enforced.
4. There is no formal eval dataset or run history for retrieval/answer quality.

## 4. Success Criteria

1. Team can run a repeatable eval suite on demand and nightly.
2. Results are visible in one place with trend lines and failed-case details.
3. A candidate change can be compared to baseline run with clear metric deltas.
4. Guardrail prevents unsupported answers when evidence is insufficient.

## 5. Data Model (Convex)

Add new schema entries:
1. `kbEvalSuites`
2. `kbEvalCases`
3. `kbEvalRuns`
4. `kbEvalCaseResults`

Suggested table fields:

`kbEvalSuites`
1. `name: string`
2. `description?: string`
3. `isActive: boolean`
4. `createdAt: number`
5. `updatedAt: number`

`kbEvalCases`
1. `suiteId: Id<"kbEvalSuites">`
2. `clientId: Id<"clients">`
3. `question: string`
4. `expectedMode: "answer" | "abstain"`
5. `expectedDocKeys: string[]`
6. `mustContain: string[]`
7. `mustNotContain: string[]`
8. `notes?: string`
9. `createdAt: number`
10. `updatedAt: number`

`kbEvalRuns`
1. `suiteId: Id<"kbEvalSuites">`
2. `label?: string`
3. `status: "queued" | "running" | "completed" | "failed"`
4. `modelConfig: { chatModel: string; embeddingModel: string; searchType: "hybrid" | "vector" | "text"; limit: number }`
5. `startedAt?: number`
6. `completedAt?: number`
7. `metrics?: { hitAt5: number; mrr: number; abstainPrecision: number; mustContainPassRate: number; hallucinationRate: number; latencyP95Ms: number }`
8. `failureReason?: string`

`kbEvalCaseResults`
1. `runId: Id<"kbEvalRuns">`
2. `caseId: Id<"kbEvalCases">`
3. `status: "passed" | "failed"`
4. `retrievedDocKeys: string[]`
5. `retrievalScores: number[]`
6. `answerText: string`
7. `abstained: boolean`
8. `metrics: { hitAt5: boolean; reciprocalRank: number; mustContainPass: boolean; mustNotContainPass: boolean; hallucinationFlag: boolean; latencyMs: number }`
9. `failureReasons: string[]`
10. `createdAt: number`

## 6. Backend Architecture

## 6.1 Shared Pipeline Functions

Create a shared internal module so production and eval follow the same logic:
1. `retrieveContext(ctx, { clientId, query, limit })`
2. `generateAnswer(ctx, { threadId, userId, prompt, retrievedContext })`
3. `decideAbstain({ retrievedScores, minScoreThreshold, minHits })`

Design rule:
1. Eval must call these same functions to avoid drift between eval and live behavior.

## 6.2 Eval Runner Actions

Add `convex/kbEval.ts`:
1. `runSuite` action: creates run, iterates cases, writes per-case results, computes aggregate metrics.
2. `runCase` action: reruns one case for debugging.
3. `listRuns` query: paginated run history.
4. `getRunDetails` query: run summary + case rows.

Execution behavior:
1. Run cases sequentially first for simplicity and deterministic load.
2. Add optional bounded concurrency later if runtime becomes too long.

## 6.3 Scoring Strategy

Retrieval metrics (deterministic):
1. `hit@5`
2. `MRR`
3. `retrieval latency`

Answer checks (rule-based first):
1. `expectedMode` pass (`answer` vs `abstain`)
2. `mustContain` pass
3. `mustNotContain` pass

Optional secondary judge (non-blocking initially):
1. Lightweight LLM hallucination flag for informational analysis.

## 6.4 Pass/Fail Gates

Initial gate thresholds:
1. `hit@5 >= 0.85`
2. `MRR >= 0.65`
3. `abstainPrecision >= 0.95`
4. `mustContainPassRate >= 0.90`
5. `hallucinationRate <= 0.05`

Gate policy:
1. Candidate changes cannot be promoted when gates fail.

## 7. Minimal Hallucination Guardrail (Phase 1)

Add a strict evidence gate before final answer generation:
1. If retrieval returns no entries, return deterministic KB-missing response.
2. If top scores are below threshold, abstain instead of answering.

Why now:
1. This is the smallest hard-enforcement step with immediate risk reduction.
2. It complements eval metrics for abstain precision.

## 8. UI and Reporting

Add admin page for eval observability:
1. Summary cards for latest run metrics.
2. Trend chart for key metrics across recent runs.
3. Failure table that includes question, expected doc keys, retrieved doc keys, answer snippet, failure reasons, and latency.

Required interactions:
1. Run suite now.
2. Compare two runs.
3. Rerun failed cases only.

## 9. Seed Dataset Plan

Initial seed:
1. 30 to 50 cases from real KB usage patterns.
2. Include both answerable and intentionally unanswerable questions.
3. Cover mixed formats: PDF, Markdown, CSV, TXT.
4. Include ambiguous wording variants and typo variants.

Balance target:
1. 70 percent answer cases.
2. 30 percent abstain cases.

## 10. Rollout Plan

Phase 0 (setup):
1. Add schema tables and CRUD helpers.
2. Add one suite and seed cases.

Phase 1 (runner):
1. Implement run action and scoring.
2. Save run and case results.

Phase 2 (UI):
1. Build results dashboard and case drill-down.
2. Add rerun case and rerun failed controls.

Phase 3 (guardrail):
1. Add retrieval evidence threshold abstain rule.
2. Validate with abstain-focused eval cases.

Phase 4 (automation):
1. Add nightly cron run.
2. Post summary into internal admin notifications or logs.

## 11. Risks and Mitigations

Risk: eval drift from production behavior.  
Mitigation: shared internal retrieval/answer pipeline.

Risk: flaky answer-quality scoring.  
Mitigation: gate on deterministic metrics first; treat LLM-judge as secondary.

Risk: suite too small to generalize.  
Mitigation: monthly additions from real failed chats and support tickets.

Risk: runtime/cost spikes for large suites.  
Mitigation: case sampling mode and nightly full run, PR-time smoke suite.

## 12. Operational Notes

1. Keep run configs explicit and persisted for reproducibility.
2. Store exact model names and search settings in each run record.
3. Preserve failing artifacts for debugging.

## 13. Migration and Data Reset Policy

Current project constraint:
1. The app currently has no production users.
2. For this phase, if schema changes are simpler via reset/delete, that is acceptable.
3. Before any destructive operation, explicitly notify the user and get confirmation.

## 14. Definition of Done

1. A seeded suite runs end-to-end and stores results.
2. Dashboard shows latest run, trends, and failed-case details.
3. Compare view highlights metric deltas and changed failures.
4. Guardrail is active and improves abstain precision without major hit@5 regression.
5. Nightly run completes successfully for 7 consecutive days.
