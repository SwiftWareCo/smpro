// lib/ai/embedding.ts

import { embed, embedMany } from 'ai'
import { db } from '../db'
import { cosineDistance, desc, gt, sql } from 'drizzle-orm'
import { embeddings } from '../db/schema/embeddings'

const embeddingModel = 'openai/text-embedding-ada-002'

// Chunk video metadata into searchable pieces
const generateVideoChunks = (video: {
  title?: string | null
  description?: string | null
  caption?: string | null
  platform: string
}): string[] => {
  const chunks: string[] = []
  
  // Title as its own chunk (high signal)
  if (video.title) {
    chunks.push(`Title: ${video.title}`)
  }
  
  // Caption/description - split by sentences
  const textContent = [video.description, video.caption]
    .filter(Boolean)
    .join(' ')
  
  if (textContent) {
    const sentences = textContent
      .trim()
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 10)
    chunks.push(...sentences)
  }
  
  // Add platform context
  if (chunks.length > 0) {
    chunks[0] = `[${video.platform}] ${chunks[0]}`
  }
  
  return chunks
}

export const generateVideoEmbeddings = async (
  videoId: string,
  video: {
    title?: string | null
    description?: string | null
    caption?: string | null
    platform: string
  }
): Promise<void> => {
  const chunks = generateVideoChunks(video)
  
  if (chunks.length === 0) return
  
  const { embeddings: vectors } = await embedMany({
    model: embeddingModel,
    values: chunks,
  })
  
  await db.insert(embeddings).values(
    vectors.map((embedding, i) => ({
      resourceId: videoId, // Link to video
      content: chunks[i],
      embedding,
    }))
  )
}

// Keep existing findRelevantContent - it works as-is!
export const findRelevantContent = async (userQuery: string) => {
  const { embedding: userQueryEmbedded } = await embed({
    model: embeddingModel,
    value: userQuery.replaceAll('\\n', ' '),
  })
  
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded
  )})`
  
  const results = await db
    .select({ 
      content: embeddings.content, 
      resourceId: embeddings.resourceId,
      similarity 
    })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy(desc(similarity))
    .limit(6)
  
  return results
}