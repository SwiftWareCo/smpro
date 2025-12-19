# RAG-Based Idea Generation System

## Overview

This document outlines the architecture and data requirements for the AI-powered content idea generation system using Retrieval-Augmented Generation (RAG).

---

## Current Architecture

### Data Flow

```
Content Sync (Instagram/Facebook API)
         ↓
Store in `content` table (metrics, captions, metadata)
         ↓
generateVideoEmbeddings() → chunks text into semantic pieces
         ↓
Store vectors in `embeddings` table (1536-dim, text-embedding-ada-002)
         ↓
User asks AI for ideas via /api/chat
         ↓
GPT-4o calls tools: searchContent, getTopPerformingContent
         ↓
findRelevantContent() → cosine similarity search (threshold: 0.5)
         ↓
AI generates ideas based on what worked + semantic relevance
         ↓
User approves → saveIdea tool stores to `savedIdeas` table
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Embedding Generation | `lib/ai/embedding.ts` | Converts content → vectors |
| Similarity Search | `lib/ai/embedding.ts` → `findRelevantContent()` | Queries similar content |
| Chat API | `app/api/chat/route.ts` | Handles AI interactions |
| AI Tools | `app/api/chat/route.ts` | searchContent, getTopPerformingContent, saveIdea, getContentStats |

### Embedding Strategy

Content is chunked into semantic pieces:
1. **Title** → dedicated chunk (high signal)
2. **Caption/Description** → split by sentences (min 10 chars)
3. **Platform prefix** → added to first chunk for context

---

## Data Currently Captured

### From Instagram (`syncInstagram` / `importInstagramData`)

| Field | Stored In | Used for RAG |
|-------|-----------|--------------|
| `id` | `platformVideoId` | Deduplication |
| `caption` | `caption`, `description` | Embeddings |
| `media_type` | `mediaType` | Filtering |
| `permalink` | `mediaUrl` | Reference |
| `timestamp` | `publishedAt` | Recency |
| `like_count` | `likes` | Performance ranking |
| `comments_count` | `comments` | Performance ranking |
| `insights.views` | `views` | Performance ranking |
| `insights.shares` | `shares` | Performance ranking |
| `insights.reach` | ❌ Not stored | - |
| `insights.saved` | ❌ Not stored | - |

### From Facebook (`syncFacebook` / `importFacebookData`)

| Field | Stored In | Used for RAG |
|-------|-----------|--------------|
| `id` | `platformVideoId` | Deduplication |
| `title` | `title` | Embeddings |
| `description` | `description`, `caption` | Embeddings |
| `permalink_url` | `mediaUrl` | Reference |
| `created_time` | `publishedAt` | Recency |
| `views` | `views` | Performance ranking |
| `likes.summary.total_count` | `likes` | Performance ranking |
| `comments.summary.total_count` | `comments` | Performance ranking |
| `length` | `duration` | Video metadata |

---

## Graph API Endpoints

### Instagram - Media with Full Insights

```
GET /{ig-user-id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(views,reach,saved,shares,impressions,engagement)&limit=50&access_token={token}
```

### Instagram - Comments (for audience voice)

```
GET /{media-id}/comments?fields=id,text,timestamp,like_count,username&limit=20&access_token={token}
```

### Facebook - Page Videos

```
GET /{page-id}/videos?fields=id,title,description,permalink_url,created_time,length,thumbnails,views,likes.summary(true),comments.summary(true),shares&limit=50&access_token={token}
```

### Facebook - Page Feed (all posts)

```
GET /{page-id}/feed?fields=id,message,created_time,shares,reactions.summary(true),comments.summary(true),insights.metric(post_impressions,post_engaged_users)&limit=50&access_token={token}
```

### Facebook - Video Comments

```
GET /{video-id}/comments?fields=id,message,created_time,like_count&limit=20&access_token={token}
```

---

## Recommended Schema Enhancements

### Phase 1: Add Missing Metrics

Add to `content` table:

```sql
ALTER TABLE content ADD COLUMN reach INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN saved INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN impressions INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN engagement_rate DECIMAL(5,4);
```

Schema update (`lib/db/schema/content.ts`):
```typescript
reach: integer("reach").default(0),
saved: integer("saved").default(0),
impressions: integer("impressions").default(0),
engagementRate: decimal("engagement_rate", { precision: 5, scale: 4 }),
```

### Phase 2: Add Hashtags

```sql
ALTER TABLE content ADD COLUMN hashtags TEXT[];
```

Schema:
```typescript
hashtags: text("hashtags").array(),
```

Parse from caption:
```typescript
const hashtags = caption?.match(/#\w+/g) || [];
```

### Phase 3: Add Top Comments

```sql
ALTER TABLE content ADD COLUMN top_comments JSONB;
```

Schema:
```typescript
topComments: jsonb("top_comments"), // Array of { text, likes }
```

---

## Enhanced Embedding Strategy

### Current Chunks
- Title (if exists)
- Caption sentences

### Recommended Chunks
1. **Title** (high weight)
2. **Caption sentences** (core content)
3. **Hashtags as single chunk** (topic signals)
4. **Top 3 comments concatenated** (audience voice)
5. **Performance summary** (e.g., "High performer: 50K views, 5% engagement")

### Implementation

Update `generateVideoChunks()` in `lib/ai/embedding.ts`:

```typescript
function generateVideoChunks(video: {
  title: string | null;
  description: string | null;
  caption: string | null;
  platform: string;
  hashtags?: string[];
  topComments?: { text: string }[];
  views?: number;
  engagementRate?: number;
}): string[] {
  const chunks: string[] = [];

  // Title chunk
  if (video.title) {
    chunks.push(`[${video.platform}] ${video.title}`);
  }

  // Caption chunks (split by sentence)
  const text = video.description || video.caption || '';
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  chunks.push(...sentences.map(s => s.trim()));

  // Hashtags chunk
  if (video.hashtags?.length) {
    chunks.push(`Topics: ${video.hashtags.join(' ')}`);
  }

  // Audience voice chunk
  if (video.topComments?.length) {
    const commentText = video.topComments.map(c => c.text).join('. ');
    chunks.push(`Audience reactions: ${commentText}`);
  }

  // Performance context
  if (video.views && video.views > 1000) {
    const perf = video.engagementRate && video.engagementRate > 0.05
      ? 'high engagement'
      : 'moderate engagement';
    chunks.push(`Performance: ${video.views.toLocaleString()} views, ${perf}`);
  }

  return chunks;
}
```

---

## AI Tool Enhancements

### Current Tools

1. `searchContent` - Semantic search via embeddings
2. `getTopPerformingContent` - Sort by metric
3. `saveIdea` - Persist ideas
4. `getContentStats` - Aggregate stats

### Recommended Additional Tools

#### `getTrendingTopics`
Returns hashtags sorted by frequency + performance correlation.

#### `getAudienceInsights`
Analyzes top comments across content to identify themes.

#### `getContentGaps`
Compares user's content topics vs. trending topics to find opportunities.

#### `getPostingPatterns`
Analyzes best-performing posting times/days.

---

## Implementation Roadmap

### Phase 1: Current State (Complete)
- Basic RAG with title/caption embeddings
- Performance-based retrieval
- Idea saving

### Phase 2: Enhanced Data Collection
- [ ] Add `reach`, `saved`, `impressions` to schema
- [ ] Parse and store hashtags from captions
- [ ] Calculate and store engagement rate
- [ ] Update import actions to capture new fields

### Phase 3: Audience Voice
- [ ] Add `topComments` field to schema
- [ ] Create comment fetching endpoints
- [ ] Include comments in embedding generation

### Phase 4: Advanced Features
- [ ] Trending topics detection
- [ ] Posting time optimization
- [ ] Content gap analysis
- [ ] Competitor content analysis (future)

---

## Performance Considerations

### Embedding Costs
- OpenAI text-embedding-ada-002: ~$0.0001 per 1K tokens
- Average post: ~100 tokens = ~$0.00001 per post
- 1000 posts = ~$0.01

### Query Latency
- HNSW index on embeddings table
- Typical query: <50ms for 10K vectors
- Consider caching frequent queries

### Storage
- 1536-dim float vector ≈ 6KB per embedding
- ~5 chunks per post average
- 1000 posts = ~30MB vector storage

---

## Testing the Pipeline

### Manual Test Flow

1. Import content via `/import` page
2. Go to Ideas page and chat with AI
3. Ask: "What content ideas would work based on my best performers?"
4. Verify AI calls `searchContent` and `getTopPerformingContent`
5. Check that suggestions reference actual past content
6. Save an idea and verify it appears in saved ideas

### Embedding Quality Check

Query the embeddings table to verify chunks:
```sql
SELECT content, resource_id
FROM embeddings
WHERE resource_id IN (SELECT id FROM content LIMIT 5);
```
