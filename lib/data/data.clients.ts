import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getProjectsByClient } from './data.projects';

export async function getClients() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt));
}

export async function getClientsWithProjects() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const clientList = await getClients();
  
  // Fetch projects for each client
  const clientsWithProjects = await Promise.all(
    clientList.map(async (client) => {
      const clientProjects = await getProjectsByClient(client.id);
      // Sort: default first, then by creation date
      const sortedProjects = [...clientProjects].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      return {
        ...client,
        projects: sortedProjects,
      };
    })
  );

  return clientsWithProjects;
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
