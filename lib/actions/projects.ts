'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  projects,
  projectModules,
  clients,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getProject } from '@/lib/data/data.projects';

// ============================================================================
// Project CRUD
// ============================================================================

export async function createProject(data: {
  clientId: string;
  name: string;
  description?: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify client ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, data.clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Check if this is the first project for this client
    const existingProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, data.clientId));

    const isFirstProject = existingProjects.length === 0;

    // Step 1: Create the project
    const [newProject] = await db
      .insert(projects)
      .values({
        clientId: data.clientId,
        userId,
        name: data.name,
        description: data.description || null,
        status: 'active',
        isDefault: isFirstProject, // First project is always default
      })
      .returning();

    try {
      // Step 2: Auto-enable social module (wrapped in try for rollback)
      await db.insert(projectModules).values({
        projectId: newProject.id,
        moduleType: 'social',
        isEnabled: true,
      });

      revalidatePath('/workspace');
      revalidatePath('/dashboard');
      revalidatePath('/');

      return { success: true, project: newProject };
    } catch (moduleError) {
      // Rollback: delete the project if module creation fails
      await db.delete(projects).where(eq(projects.id, newProject.id));
      throw moduleError;
    }
  } catch (error) {
    console.error('Create project error:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; status?: 'active' | 'archived' | 'paused' }
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Project not found' };
    }

    const updateData: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    revalidatePath('/workspace');
    revalidatePath('/dashboard');

    return { success: true, project: updatedProject };
  } catch (error) {
    console.error('Update project error:', error);
    return { success: false, error: 'Failed to update project' };
  }
}

export async function archiveProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Project not found' };
    }

    // Don't allow archiving the default project
    if (project.isDefault) {
      return { success: false, error: 'Cannot archive default project' };
    }

    const [archivedProject] = await db
      .update(projects)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();

    revalidatePath('/workspace');
    revalidatePath('/dashboard');

    return { success: true, project: archivedProject };
  } catch (error) {
    console.error('Archive project error:', error);
    return { success: false, error: 'Failed to archive project' };
  }
}

export async function setDefaultProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Project not found' };
    }

    // Unset all other default projects for this client
    await db
      .update(projects)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(projects.clientId, project.clientId),
          eq(projects.userId, userId),
          eq(projects.isDefault, true)
        )
      );

    // Set this project as default
    const [defaultProject] = await db
      .update(projects)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();

    revalidatePath('/workspace');
    revalidatePath('/dashboard');

    return { success: true, project: defaultProject };
  } catch (error) {
    console.error('Set default project error:', error);
    return { success: false, error: 'Failed to set default project' };
  }
}

// ============================================================================
// Module Management
// ============================================================================

export async function enableModule(
  projectId: string,
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets'
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Project not found' };
    }

    // Check if module already exists
    const existing = await db
      .select()
      .from(projectModules)
      .where(
        and(
          eq(projectModules.projectId, projectId),
          eq(projectModules.moduleType, moduleType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing module to enabled
      const [updated] = await db
        .update(projectModules)
        .set({ isEnabled: true, enabledAt: new Date(), updatedAt: new Date() })
        .where(eq(projectModules.id, existing[0].id))
        .returning();

      revalidatePath('/workspace');
      return { success: true, module: updated };
    }

    // Create new module entry
    const [newModule] = await db
      .insert(projectModules)
      .values({
        projectId,
        moduleType,
        isEnabled: true,
        enabledAt: new Date(),
      })
      .returning();

    revalidatePath('/workspace');
    return { success: true, module: newModule };
  } catch (error) {
    console.error('Enable module error:', error);
    return { success: false, error: 'Failed to enable module' };
  }
}

export async function disableModule(
  projectId: string,
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets'
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Project not found' };
    }

    const disabled = await db
      .update(projectModules)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(
        and(
          eq(projectModules.projectId, projectId),
          eq(projectModules.moduleType, moduleType)
        )
      )
      .returning();

    if (disabled.length === 0) {
      return { success: false, error: 'Module not found' };
    }

    revalidatePath('/workspace');
    return { success: true, module: disabled[0] };
  } catch (error) {
    console.error('Disable module error:', error);
    return { success: false, error: 'Failed to disable module' };
  }
}

export async function updateModuleConfig(
  projectId: string,
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets',
  config: Record<string, unknown>
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Project not found' };
    }

    const updated = await db
      .update(projectModules)
      .set({ config, updatedAt: new Date() })
      .where(
        and(
          eq(projectModules.projectId, projectId),
          eq(projectModules.moduleType, moduleType)
        )
      )
      .returning();

    if (updated.length === 0) {
      return { success: false, error: 'Module not found' };
    }

    revalidatePath('/workspace');
    return { success: true, module: updated[0] };
  } catch (error) {
    console.error('Update module config error:', error);
    return { success: false, error: 'Failed to update module config' };
  }
}

