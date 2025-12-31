import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getClients() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt));
}

export async function getClient(clientId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  const client = result[0];

  // Verify ownership
  if (client && client.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return client || null;
}

export async function updateClientModules(clientId: string, modules: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify ownership
  const client = await getClient(clientId);
  if (!client) throw new Error('Client not found');

  const [updated] = await db
    .update(clients)
    .set({
      enabledModules: modules,
      updatedAt: sql`now()`,
    })
    .where(eq(clients.id, clientId))
    .returning();

  return updated;
}

export async function updateClientStatus(
  clientId: string,
  status: 'lead' | 'onboarding' | 'active' | 'paused' | 'churned'
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify ownership
  const client = await getClient(clientId);
  if (!client) throw new Error('Client not found');

  const [updated] = await db
    .update(clients)
    .set({
      status,
      updatedAt: sql`now()`,
    })
    .where(eq(clients.id, clientId))
    .returning();

  return updated;
}
