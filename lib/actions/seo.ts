'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { upsertSeoSettings, getSeoSettings as getClientSeoSettings } from '@/lib/data/data.seo';
import { getClient } from '@/lib/data/data.clients';

export interface SeoSettingsInput {
  websiteUrl?: string | null;
  targetKeywords?: string[];
  targetLocations?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export async function updateSeoSettings(
  clientId: string,
  data: SeoSettingsInput
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify client ownership
    const client = await getClient(clientId);
    if (!client || client.userId !== userId) {
      return { success: false, error: 'Client not found' };
    }

    const settings = await upsertSeoSettings(clientId, data);

    revalidatePath(`/workspace/${clientId}`);
    return { success: true, settings };
  } catch (error) {
    console.error('Update SEO settings error:', error);
    return { success: false, error: 'Failed to update SEO settings' };
  }
}

export async function getSeoSettings(clientId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify client ownership
    const client = await getClient(clientId);
    if (!client || client.userId !== userId) {
      return { success: false, error: 'Client not found' };
    }

    const settings = await getClientSeoSettings(clientId);

    return {
      success: true,
      settings,
    };
  } catch (error) {
    console.error('Get SEO settings error:', error);
    return { success: false, error: 'Failed to get SEO settings' };
  }
}

