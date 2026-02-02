import type { QueryCtx } from '../../_generated/server';

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * (b[i] ?? 0);
    normA += a[i] * a[i];
  }
  for (let i = 0; i < b.length; i++) {
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function search(
  ctx: QueryCtx,
  embedding: number[],
  options: { limit?: number; minScore?: number }
) {
  const items = await ctx.db.query('embeddings').collect();
  const scored = items.map((item) => ({
    content: item.content,
    resourceId: item.resourceId,
    similarity: cosineSimilarity(item.embedding ?? [], embedding),
  }));

  const minScore = options.minScore ?? 0.5;
  return scored
    .filter((item) => item.similarity >= minScore)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.limit ?? 6);
}
