# Knowledge Base / RAG System

## Overview

The Knowledge Base module lets clients upload documents (PDF, Markdown, CSV, TXT) and ask natural language questions about their data. It uses vector search + text search (hybrid) for retrieval and free AI models for answers.

**Module key:** `knowledge_base`

---

## Architecture

```
Upload:   File → Convex Storage → Node Action (extract text) → rag.add() (chunk + embed + store)
Search:   Question → rag.search() (embed + hybrid search) → Context → OpenRouter LLM → Answer
```

### AI Providers (free tier)

| Purpose | Provider | Model |
|---------|----------|-------|
| Embeddings | Google Gemini | `gemini-embedding-exp-03-07` (768 dims) |
| Chat Q&A | OpenRouter | `google/gemini-2.0-flash-exp:free` |

### Environment Variables Required

| Variable | Where | Purpose |
|----------|-------|---------|
| `GEMINI_API_KEY` | Convex dashboard | Embedding generation |
| `OPENROUTER_API_KEY` | Convex dashboard + Vercel | Chat responses + fallback translations |

---

## File Structure

### Convex (Backend)

| File | Purpose |
|------|---------|
| `convex/convex.config.ts` | Registers `@convex-dev/rag` component |
| `convex/schema/knowledge-base.schema.ts` | `kbDocuments` + `kbFolders` table definitions |
| `convex/_lib/rag.ts` | Shared RAG instance config |
| `convex/db/knowledgeBase/read.ts` | DB query helpers |
| `convex/db/knowledgeBase/write.ts` | DB mutation helpers |
| `convex/knowledgeBase.ts` | Queries, mutations, internal mutations |
| `convex/knowledgeBaseActions.ts` | Node actions: process document, search, delete RAG entry |
| `convex/pdf-parse.d.ts` | Type declarations for pdf-parse v1 |

### Frontend

| File | Purpose |
|------|---------|
| `app/(client-portal)/portal/knowledge-base/page.tsx` | Portal KB page (Documents + Chat tabs) |
| `app/api/kb-chat/route.ts` | Streaming chat API route |
| `components/knowledge-base/document-list.tsx` | Document list with status badges |
| `components/knowledge-base/document-upload.tsx` | Drag-and-drop file upload |
| `components/knowledge-base/kb-chat.tsx` | Chat Q&A interface |
| `components/knowledge-base/folder-create-dialog.tsx` | Folder creation dialog |
| `components/workspace/knowledge-base-tab.tsx` | Admin workspace read-only tab |

### Modified Files

| File | Change |
|------|--------|
| `convex/schema.ts` | Registered `kbDocuments`, `kbFolders` |
| `components/workspace/workspace-tabs.tsx` | Added `knowledge_base` module display + tab |
| `components/workspace/module-enablement-dialog.tsx` | Added `knowledge_base` to available modules |
| `components/portal/portal-sidebar.tsx` | Added Knowledge Base nav item |

---

## Database Tables

### `kbDocuments`

Tracks uploaded/created documents and their processing state.

| Field | Type | Notes |
|-------|------|-------|
| `clientId` | `Id<"clients">` | Tenant ownership |
| `folderId` | `Id<"kbFolders">?` | Optional folder assignment |
| `title` | `string` | Display name (filename without extension for uploads) |
| `description` | `string?` | Optional description |
| `sourceType` | `"upload" \| "manual"` | How the document was created |
| `fileType` | `"pdf" \| "markdown" \| "csv" \| "txt"?` | File format (uploads only) |
| `storageId` | `Id<"_storage">?` | Convex file storage reference |
| `rawText` | `string?` | Extracted full text |
| `charCount` | `number?` | Character count of extracted text |
| `processingStatus` | `"pending" \| "extracting" \| "embedding" \| "ready" \| "failed"` | Current state |
| `processingError` | `string?` | Error message if failed |
| `createdBy` | `string` | User ID |

**Indexes:** `by_client_id`, `by_client_folder`, `by_client_status`

### `kbFolders`

Hierarchical folder structure for organizing documents.

| Field | Type | Notes |
|-------|------|-------|
| `clientId` | `Id<"clients">` | Tenant ownership |
| `name` | `string` | Folder name |
| `description` | `string?` | Optional |
| `parentId` | `Id<"kbFolders">?` | Self-reference for nesting |
| `sortOrder` | `number` | Display order |
| `createdBy` | `string` | User ID |

**Indexes:** `by_client_id`, `by_client_parent`

### RAG Component Tables

Managed internally by `@convex-dev/rag`. Stores chunks, embeddings, namespaces. Tenant isolation is handled by using `clientId` as the RAG namespace.

---

## Processing Pipeline

1. Client uploads file via portal
2. `generateUploadUrl` mutation → file POSTed to Convex storage
3. `uploadDocument` mutation creates `kbDocuments` record (status: `pending`), schedules `processDocument` action
4. `processDocument` (Node action):
   - Downloads file from Convex storage
   - Extracts text by type (pdf-parse for PDF, raw for MD/TXT, row formatting for CSV)
   - Saves extracted text, updates status to `embedding`
   - Calls `rag.add()` with `namespace: clientId` — auto-chunks and embeds via Gemini
   - Updates status to `ready`
   - On any error: status → `failed` with error message
5. Document is now searchable via hybrid vector + text search

---

## Current Capabilities

### Portal (clients)

- Upload PDF, Markdown, CSV, TXT files (max 10MB)
- Real-time processing status (reactive Convex queries)
- Delete documents (removes storage file + RAG entries)
- Create folders
- Chat Q&A with source citations
- Tenant-isolated search (client A never sees client B's data)

### Admin Workspace

- Read-only document list with status badges
- Document count summary

---

## Remaining Work

### Phase 2: Document Management

- [ ] **Conditional sidebar nav** — only show Knowledge Base link when module is enabled for the client (currently always visible)
- [ ] **Folder tree UI** — expand/collapse hierarchy, nested folder navigation
- [ ] **Drag-and-drop between folders** — using existing `@dnd-kit`
- [ ] **Document viewer panel** — show extracted text, metadata, chunk count
- [ ] **Manual document creation** — dialog for pasting/typing text content directly
- [ ] **Batch upload** — multiple files at once with progress tracking
- [ ] **Conversation history** — save/load past Q&A sessions (currently each visit starts fresh)
- [ ] **Admin stats** — document count, total chars, embedding usage in workspace tab

### Phase 3: AI Features

- [ ] **Auto-generated summaries** — summarize each document on upload
- [ ] **Related documents** — suggest similar documents via vector similarity
- [ ] **AI folder suggestions** — recommend folder structure based on content
- [ ] **Column-aware CSV Q&A** — smarter handling of structured data
- [ ] **URL ingestion** — scrape web pages and add to knowledge base
- [ ] **Auto-tagging/categorization** — classify documents automatically
- [ ] **Importance weighting** — prioritize certain documents in search (RAG component supports this natively)
- [ ] **Consider `@convex-dev/agent`** — for persistent chat threads with full message history

---

## Technical Notes

- **pdf-parse v1** is used intentionally. v2 requires DOM APIs (`DOMMatrix`) that don't exist in Convex's Node runtime.
- pdf-parse v1 tries to load a test PDF at module level, so it must be **dynamically imported** inside the action handler.
- **`@ai-sdk/openai` v2** is used. v3 returns `LanguageModelV3` which is incompatible with `ai` v5's `streamText` (expects `LanguageModelV2`).
- AI SDK v5 `useChat` hook uses `sendMessage()` with `DefaultChatTransport` — not the old `handleSubmit`/`input`/`handleInputChange` pattern.
- RAG search uses **hybrid mode** (vector + full-text) for better retrieval quality.
- The `searchKnowledgeBase` action runs an auth check by calling `listDocuments` (which calls `requireClientAccess`) before performing the search.
