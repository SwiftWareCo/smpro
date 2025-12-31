'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clients, connectedAccounts, content } from '@/lib/db/schema';
import { generateVideoEmbeddings } from '@/lib/ai/embedding';
import { eq, and } from 'drizzle-orm';
import { nanoid } from '@/lib/utils';

// ============================================================================
// Client CRUD
// ============================================================================

export async function createClient(data: { name: string; description?: string }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Create client with default 'social' module enabled
    const [newClient] = await db
      .insert(clients)
      .values({
        userId,
        name: data.name,
        description: data.description || null,
        status: 'active',
        enabledModules: ['social'], // Default to social module
      })
      .returning();

    revalidatePath('/import');
    revalidatePath('/content');
    revalidatePath('/'); // Refresh dashboard and sidebar

    return {
      success: true,
      client: newClient,
    };
  } catch (error) {
    console.error('Create client error:', error);
    return { success: false, error: 'Failed to create client' };
  }
}

export async function updateClient(
  clientId: string,
  data: {
    name?: string;
    description?: string | null;
    avatarUrl?: string | null;
    status?: 'lead' | 'onboarding' | 'active' | 'paused' | 'churned';
  }
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Build update object with only provided fields
    const updateData: {
      name?: string;
      description?: string | null;
      avatarUrl?: string | null;
      status?: 'lead' | 'onboarding' | 'active' | 'paused' | 'churned';
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.status !== undefined) updateData.status = data.status;

    await db.update(clients).set(updateData).where(eq(clients.id, clientId));

    revalidatePath('/');
    revalidatePath(`/workspace/${clientId}`);

    return { success: true };
  } catch (error) {
    console.error('Update client error:', error);
    return { success: false, error: 'Failed to update client' };
  }
}

export async function deleteClient(clientId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Get all accounts for this client
    const clientAccounts = await db
      .select({ id: connectedAccounts.id })
      .from(connectedAccounts)
      .where(eq(connectedAccounts.clientId, clientId));

    const accountIds = clientAccounts.map((acc) => acc.id);

    // Delete content for these accounts
    if (accountIds.length > 0) {
      for (const accountId of accountIds) {
        await db.delete(content).where(eq(content.accountId, accountId));
      }
    }

    // Delete connected accounts for this client
    await db
      .delete(connectedAccounts)
      .where(eq(connectedAccounts.clientId, clientId));

    // Delete the client
    await db.delete(clients).where(eq(clients.id, clientId));

    revalidatePath('/import');
    revalidatePath('/content');

    return { success: true };
  } catch (error) {
    console.error('Delete client error:', error);
    return { success: false, error: 'Failed to delete client' };
  }
}

// ============================================================================
// Import Actions
// ============================================================================

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    data: Array<{
      name: string;
      values: Array<{ value: number }>;
    }>;
  };
}

interface InstagramApiResponse {
  data: InstagramMedia[];
}

export async function importInstagramData(
  clientId: string,
  jsonData: string
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify client ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Parse JSON
    let apiResponse: InstagramApiResponse;
    try {
      apiResponse = JSON.parse(jsonData);
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }

    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      return { success: false, error: 'Invalid API response format. Expected { data: [...] }' };
    }

    // Create or get a mock connected account for this client
    let account = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.clientId, clientId),
          eq(connectedAccounts.platform, 'instagram')
        )
      )
      .limit(1);

    if (account.length === 0) {
      // Create mock account
      const [newAccount] = await db
        .insert(connectedAccounts)
        .values({
          userId,
          clientId,
          platform: 'instagram',
          accessToken: 'mock_token_' + nanoid(),
          platformUserId: 'mock_ig_' + nanoid(),
          platformUsername: client[0].name.toLowerCase().replace(/\s+/g, '_'),
        })
        .returning();
      account = [newAccount];
    }

    const accountId = account[0].id;
    let imported = 0;

    for (const media of apiResponse.data) {
      // Parse insights
      const insights =
        media.insights?.data?.reduce(
          (acc: Record<string, number>, item) => {
            acc[item.name] = item.values?.[0]?.value || 0;
            return acc;
          },
          {}
        ) || {};

      // Upsert content
      const [inserted] = await db
        .insert(content)
        .values({
          accountId,
          platform: 'instagram',
          platformVideoId: media.id,
          mediaType: media.media_type,
          title: null,
          description: media.caption || null,
          caption: media.caption || null,
          thumbnailUrl: media.thumbnail_url || media.media_url || null,
          mediaUrl: media.permalink,
          views: insights.views || 0,
          likes: media.like_count || 0,
          comments: media.comments_count || 0,
          shares: insights.shares || 0,
          publishedAt: new Date(media.timestamp),
          rawData: media,
        })
        .onConflictDoUpdate({
          target: [content.platformVideoId],
          set: {
            views: insights.views || 0,
            likes: media.like_count || 0,
            comments: media.comments_count || 0,
            shares: insights.shares || 0,
            updatedAt: new Date(),
          },
        })
        .returning();

      // Generate embeddings for content with captions
      if (inserted && media.caption) {
        try {
          await generateVideoEmbeddings(inserted.id, {
            title: null,
            description: media.caption,
            caption: media.caption,
            platform: 'instagram',
          });
        } catch (error) {
          console.error('Embedding generation error:', error);
        }
      }

      imported++;
    }

    revalidatePath('/content');
    revalidatePath('/import');

    return {
      success: true,
      imported,
      message: `Imported ${imported} Instagram posts`,
    };
  } catch (error) {
    console.error('Import Instagram error:', error);
    return { success: false, error: 'Failed to import Instagram data' };
  }
}

interface FacebookVideo {
  id: string;
  title?: string;
  description?: string;
  permalink_url: string;
  created_time: string;
  length?: number;
  thumbnails?: {
    data: Array<{ uri: string }>;
  };
  views?: number;
  likes?: {
    summary: { total_count: number };
  };
  comments?: {
    summary: { total_count: number };
  };
}

interface FacebookApiResponse {
  data: FacebookVideo[];
}

export async function importFacebookData(
  clientId: string,
  jsonData: string
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify client ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Parse JSON
    let apiResponse: FacebookApiResponse;
    try {
      apiResponse = JSON.parse(jsonData);
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }

    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      return { success: false, error: 'Invalid API response format. Expected { data: [...] }' };
    }

    // Create or get a mock connected account for this client
    let account = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.clientId, clientId),
          eq(connectedAccounts.platform, 'facebook')
        )
      )
      .limit(1);

    if (account.length === 0) {
      const [newAccount] = await db
        .insert(connectedAccounts)
        .values({
          userId,
          clientId,
          platform: 'facebook',
          accessToken: 'mock_token_' + nanoid(),
          platformUserId: 'mock_fb_' + nanoid(),
          platformUsername: client[0].name.toLowerCase().replace(/\s+/g, '_'),
        })
        .returning();
      account = [newAccount];
    }

    const accountId = account[0].id;
    let imported = 0;

    for (const video of apiResponse.data) {
      const [inserted] = await db
        .insert(content)
        .values({
          accountId,
          platform: 'facebook',
          platformVideoId: video.id,
          mediaType: 'VIDEO',
          title: video.title || null,
          description: video.description || null,
          caption: video.description || null,
          thumbnailUrl: video.thumbnails?.data?.[0]?.uri || null,
          mediaUrl: video.permalink_url,
          views: video.views || 0,
          likes: video.likes?.summary?.total_count || 0,
          comments: video.comments?.summary?.total_count || 0,
          shares: 0,
          duration: video.length || null,
          publishedAt: new Date(video.created_time),
          rawData: video,
        })
        .onConflictDoUpdate({
          target: [content.platformVideoId],
          set: {
            views: video.views || 0,
            likes: video.likes?.summary?.total_count || 0,
            comments: video.comments?.summary?.total_count || 0,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (inserted && (video.title || video.description)) {
        try {
          await generateVideoEmbeddings(inserted.id, {
            title: video.title || null,
            description: video.description || null,
            caption: null,
            platform: 'facebook',
          });
        } catch (error) {
          console.error('Embedding generation error:', error);
        }
      }

      imported++;
    }

    revalidatePath('/content');
    revalidatePath('/import');

    return {
      success: true,
      imported,
      message: `Imported ${imported} Facebook videos`,
    };
  } catch (error) {
    console.error('Import Facebook error:', error);
    return { success: false, error: 'Failed to import Facebook data' };
  }
}

// ============================================================================
// Module Management
// ============================================================================

export async function updateClientModules(clientId: string, modules: string[]) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    await db
      .update(clients)
      .set({ enabledModules: modules })
      .where(eq(clients.id, clientId));

    revalidatePath('/');
    revalidatePath(`/workspace/${clientId}`);

    return { success: true };
  } catch (error) {
    console.error('Update client modules error:', error);
    return { success: false, error: 'Failed to update modules' };
  }
}

export async function updateClientStatus(
  clientId: string,
  status: 'lead' | 'onboarding' | 'active' | 'paused' | 'churned'
) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (client.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    await db
      .update(clients)
      .set({ status })
      .where(eq(clients.id, clientId));

    revalidatePath('/');
    revalidatePath('/pipeline');

    return { success: true };
  } catch (error) {
    console.error('Update client status error:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
