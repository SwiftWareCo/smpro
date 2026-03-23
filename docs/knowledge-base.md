# Knowledge Base / RAG System

## Overview

The Knowledge Base module lets clients upload documents (PDF, Markdown, CSV, TXT) and ask natural language questions about their data. It uses vector search + text search (hybrid) for retrieval and free AI models for answers.

**Module key:** `knowledge_base`

---

## Architecture

```
Upload:   File → Convex Storage → Node Action (extract text via unpdf) → rag.add() (chunk + embed + store)
Chat:     Question → Agent (scheduled action) → rag.search() (hybrid) → Context → Gemini → Delta-streamed answer via WebSocket
```

### AI Providers (free tier)

| Purpose | Provider | Model |
|---------|----------|-------|
| Embeddings | Google Gemini | `gemini-embedding-2-preview` (3072 dims) |
| Chat Q&A | Google Gemini (via `@ai-sdk/google`) | `gemini-3.1-flash-lite-preview` |

### Environment Variables Required

| Variable | Where | Purpose |
|----------|-------|---------|
| `GEMINI_API_KEY` | Convex dashboard | Embedding generation + Chat responses |

---

## File Structure

### Convex (Backend)

| File | Purpose |
|------|---------|
| `convex/convex.config.ts` | Registers `@convex-dev/rag` + `@convex-dev/agent` components |
| `convex/schema/knowledge-base.schema.ts` | `kbDocuments`, `kbFolders`, `kbThreads` table definitions |
| `convex/_lib/rag.ts` | Shared RAG instance config |
| `convex/db/knowledgeBase/read.ts` | DB query helpers |
| `convex/db/knowledgeBase/write.ts` | DB mutation helpers |
| `convex/knowledgeBase.ts` | Queries, mutations, internal mutations |
| `convex/knowledgeBaseActions.ts` | Node actions: process document, search, delete RAG entry, `reprocessAllDocuments` |
| `convex/kbAgent.ts` | Agent definition + respond action |
| `convex/kbChat.ts` | Chat mutations/queries: startChat, listThreadMessages, listThreads, deleteThread |

### Frontend

| File | Purpose |
|------|---------|
| `app/(client-portal)/portal/knowledge-base/page.tsx` | Portal KB page (Documents + Chat tabs) |
| `components/knowledge-base/document-list.tsx` | Document list with folders, status badges, drag-and-drop |
| `components/knowledge-base/document-upload.tsx` | Batch drag-and-drop file upload |
| `components/knowledge-base/kb-chat.tsx` | Chat Q&A interface |
| `components/knowledge-base/folder-create-dialog.tsx` | Folder creation dialog |
| `components/knowledge-base/folder-breadcrumbs.tsx` | Breadcrumb navigation for folder hierarchy |
| `components/knowledge-base/manual-document-dialog.tsx` | Manual document creation dialog |
| `components/knowledge-base/document-viewer.tsx` | Document viewer sheet (metadata + raw text) |
| `components/knowledge-base/thread-list.tsx` | Conversation history sidebar |
| `components/workspace/knowledge-base-tab.tsx` | Admin workspace tab with stats + read-only doc list |

### Modified Files

| File | Change |
|------|--------|
| `convex/schema.ts` | Registered `kbDocuments`, `kbFolders`, `kbThreads` |
| `components/workspace/workspace-tabs.tsx` | Added `knowledge_base` module display + tab |
| `components/workspace/module-enablement-dialog.tsx` | Added `knowledge_base` to available modules |
| `components/portal/portal-sidebar.tsx` | Added Knowledge Base nav item (conditional on module) |

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
| `chunkCount` | `number?` | Estimated RAG chunk count |
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

### `kbThreads`

Tracks conversation threads for the chat Q&A feature.

| Field | Type | Notes |
|-------|------|-------|
| `clientId` | `Id<"clients">` | Tenant ownership |
| `agentThreadId` | `string` | Internal agent thread reference |
| `title` | `string?` | Auto-set from first message |
| `userId` | `string` | User who created the thread |
| `lastMessageAt` | `number` | Timestamp of last message |

**Indexes:** `by_client_user`, `by_agent_thread`

### RAG Component Tables

Managed internally by `@convex-dev/rag`. Stores chunks, embeddings, namespaces. Tenant isolation is handled by using `clientId` as the RAG namespace.

---

## Processing Pipeline

1. Client uploads file via portal
2. `generateUploadUrl` mutation → file POSTed to Convex storage
3. `uploadDocument` mutation creates `kbDocuments` record (status: `pending`), schedules `processDocument` action
4. `processDocument` (Node action):
   - Downloads file from Convex storage
   - Extracts text by type (`unpdf` with `getDocumentProxy` + `extractText` for PDF, raw for MD/TXT, row formatting for CSV)
   - Saves extracted text, updates status to `embedding`
   - Calls `rag.add()` with `namespace: clientId` — auto-chunks and embeds via Gemini
   - Estimates chunk count and updates status to `ready`
   - On any error: status → `failed` with error message
5. Document is now searchable via hybrid vector + text search

---

## Current Capabilities

### Portal (clients)

- Upload PDF, Markdown, CSV, TXT files (max 10MB) — batch upload supported
- Real-time processing status (reactive Convex queries)
- Delete documents (removes storage file + RAG entries)
- Create folders with hierarchical navigation + breadcrumbs
- Drag-and-drop documents between folders
- Create manual text documents
- View document details (metadata, raw text, chunk count)
- Chat Q&A with source citations and conversation history
- Tenant-isolated search (client A never sees client B's data)

### Admin Workspace

- Stat cards: total/ready/pending/failed document counts, total characters, folder count
- Read-only document list with status badges

---

## Remaining Work

### Phase 2: Document Management — DONE

- [x] **Conditional sidebar nav** — only show Knowledge Base link when module is enabled for the client
- [x] **Folder tree UI** — breadcrumb navigation, nested folder hierarchy
- [x] **Drag-and-drop between folders** — using `@dnd-kit`
- [x] **Document viewer panel** — show extracted text, metadata, chunk count
- [x] **Manual document creation** — dialog for pasting/typing text content directly
- [x] **Batch upload** — multiple files at once with progress tracking
- [x] **Conversation history** — save/load past Q&A sessions with thread list sidebar
- [x] **Admin stats** — document count, total chars, folder count in workspace tab

### Phase 3: AI Features

- [ ] **Auto-generated summaries** — summarize each document on upload
- [ ] **Related documents** — suggest similar documents via vector similarity
- [ ] **AI folder suggestions** — recommend folder structure based on content
- [ ] **Column-aware CSV Q&A** — smarter handling of structured data
- [ ] **URL ingestion** — scrape web pages and add to knowledge base
- [ ] **Auto-tagging/categorization** — classify documents automatically
- [ ] **Importance weighting** — prioritize certain documents in search (RAG component supports this natively)

---

## Technical Notes

- **unpdf** is used for PDF text extraction via `getDocumentProxy(new Uint8Array(arrayBuffer))` + `extractText(pdf, { mergePages: true })`. Replaced pdf-parse which crashes in Convex's esbuild bundler.
- **`@convex-dev/agent`** handles chat with delta streaming via WebSocket (no HTTP SSE / Next.js API route needed).
- **`@ai-sdk/google`** with `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })` — the default `google` import expects `GOOGLE_GENERATIVE_AI_API_KEY`.
- RAG search uses **hybrid mode** (vector + full-text) for better retrieval quality.
- The `searchKnowledgeBase` action runs an auth check by calling `listDocuments` (which calls `requireClientAccess`) before performing the search.
