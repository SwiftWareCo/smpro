'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { projectSeoSettings, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from '@/lib/utils';
import { getProject } from '@/lib/data/data.projects';

export interface SeoSettingsInput {
  websiteUrl?: string | null;
  targetKeywords?: string[];
  targetLocations?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export async function updateSeoSettings(
  projectId: string,
  data: SeoSettingsInput
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

    // Check if SEO settings already exist
    const existing = await db
      .select()
      .from(projectSeoSettings)
      .where(eq(projectSeoSettings.projectId, projectId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing settings
      const updateData: Partial<typeof projectSeoSettings.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
      if (data.targetKeywords !== undefined)
        updateData.targetKeywords = data.targetKeywords;
      if (data.targetLocations !== undefined)
        updateData.targetLocations = data.targetLocations;
      if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
      if (data.metaDescription !== undefined)
        updateData.metaDescription = data.metaDescription;

      const [updated] = await db
        .update(projectSeoSettings)
        .set(updateData)
        .where(eq(projectSeoSettings.projectId, projectId))
        .returning();

      revalidatePath('/workspace');
      return { success: true, settings: updated };
    }

    // Create new SEO settings
    const [newSettings] = await db
      .insert(projectSeoSettings)
      .values({
        projectId,
        websiteUrl: data.websiteUrl || null,
        targetKeywords: data.targetKeywords || [],
        targetLocations: data.targetLocations || [],
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
      })
      .returning();

    revalidatePath('/workspace');
    return { success: true, settings: newSettings };
  } catch (error) {
    console.error('Update SEO settings error:', error);
    return { success: false, error: 'Failed to update SEO settings' };
  }
}

export async function getSeoSettings(projectId: string) {
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

    const settings = await db
      .select()
      .from(projectSeoSettings)
      .where(eq(projectSeoSettings.projectId, projectId))
      .limit(1);

    return {
      success: true,
      settings: settings[0] || null,
    };
  } catch (error) {
    console.error('Get SEO settings error:', error);
    return { success: false, error: 'Failed to get SEO settings' };
  }
}

