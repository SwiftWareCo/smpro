import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { projects, projectModules } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getProjectsByClient(clientId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return await db
    .select()
    .from(projects)
    .where(and(eq(projects.clientId, clientId), eq(projects.userId, userId)))
    .orderBy(desc(projects.createdAt));
}

export async function getProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = result[0];

  // Verify ownership
  if (project && project.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return project || null;
}

export async function getProjectWithModules(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const project = await getProject(projectId);
  if (!project) return null;

  const modules = await db
    .select()
    .from(projectModules)
    .where(eq(projectModules.projectId, projectId));

  return {
    ...project,
    modules,
  };
}

export async function getDefaultProject(clientId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const result = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.clientId, clientId),
        eq(projects.userId, userId),
        eq(projects.isDefault, true)
      )
    )
    .limit(1);

  return result[0] || null;
}


