import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { projectSeoSettings, projects } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function getSeoSettings(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project[0]) {
    throw new Error('Project not found or unauthorized');
  }

  const result = await db
    .select()
    .from(projectSeoSettings)
    .where(eq(projectSeoSettings.projectId, projectId))
    .limit(1);

  return result[0] || null;
}

export async function getSeoSettingsByClient(clientId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get all projects for the client
  const clientProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.clientId, clientId), eq(projects.userId, userId)));

  if (clientProjects.length === 0) {
    return [];
  }

  const projectIds = clientProjects.map((p) => p.id);

  // Use IN clause for better performance
  return await db
    .select()
    .from(projectSeoSettings)
    .where(inArray(projectSeoSettings.projectId, projectIds));
}

