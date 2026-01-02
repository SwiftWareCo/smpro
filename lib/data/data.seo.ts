import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { clientSeoSettings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getClient } from './data.clients';

export async function getSeoSettings(clientId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify client ownership
  const client = await getClient(clientId);
  if (!client) throw new Error('Client not found');

  const result = await db
    .select()
    .from(clientSeoSettings)
    .where(eq(clientSeoSettings.clientId, clientId))
    .limit(1);

  return result[0] || null;
}

export async function upsertSeoSettings(
  clientId: string,
  settings: {
    websiteUrl?: string | null;
    targetKeywords?: string[] | null;
    targetLocations?: string[] | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    industry?: string | null;
    analyzedAt?: Date | null;
    analysisProvider?: string | null;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify client ownership
  const client = await getClient(clientId);
  if (!client) throw new Error('Client not found');

  // Check if settings exist
  const existing = await getSeoSettings(clientId);

  if (existing) {
    // Update existing settings
    const [updated] = await db
      .update(clientSeoSettings)
      .set({
        ...settings,
        updatedAt: sql`now()`,
      })
      .where(eq(clientSeoSettings.id, existing.id))
      .returning();

    return updated;
  } else {
    // Create new settings
    const [created] = await db
      .insert(clientSeoSettings)
      .values({
        clientId,
        ...settings,
      })
      .returning();

    return created;
  }
}
