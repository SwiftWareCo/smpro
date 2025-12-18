'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { connectedAccounts, content } from '@/lib/db/schema';
import { generateVideoEmbeddings } from '@/lib/ai/embedding';
import { eq, and } from 'drizzle-orm';

const META_GRAPH_URL = 'https://graph.facebook.com/v24.0';

export async function syncInstagram() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get Instagram connected account
    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.platform, 'instagram')
        )
      );

    if (accounts.length === 0) {
      return { success: false, error: 'Instagram not connected' };
    }

    let totalSynced = 0;

    for (const account of accounts) {
      const igAccountId = account.platformUserId;
      const accessToken = account.accessToken;

      // Fetch media from Instagram
      // Fields: https://developers.facebook.com/docs/instagram-api/reference/ig-media
      const mediaRes = await fetch(
        `${META_GRAPH_URL}/${igAccountId}/media?` +
          `fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,` +
          `like_count,comments_count,insights.metric(views,reach,saved,shares)` +
          `&limit=50` +
          `&access_token=${accessToken}`
      );

      const mediaData = await mediaRes.json();

      if (mediaData.error) {
        console.error('Instagram API error:', mediaData.error);
        return { success: false, error: mediaData.error.message };
      }

      for (const media of mediaData.data || []) {
        // Parse insights
        const insights =
          media.insights?.data?.reduce((acc: any, item: any) => {
            acc[item.name] = item.values?.[0]?.value || 0;
            return acc;
          }, {}) || {};

        // Upsert content
        const [inserted] = await db
          .insert(content)
          .values({
            accountId: account.id,
            platform: 'instagram',
            platformVideoId: media.id,
            mediaType: media.media_type, // VIDEO, REELS, IMAGE, CAROUSEL_ALBUM
            title: null, // Instagram doesn't have titles
            description: media.caption,
            caption: media.caption,
            thumbnailUrl: media.thumbnail_url || media.media_url,
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

        // Generate embeddings for new content
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
            // Continue even if embedding fails
          }
        }

        totalSynced++;
      }
    }

    revalidatePath('/content');
    revalidatePath('/settings');

    return {
      success: true,
      synced: totalSynced,
      message: `Synced ${totalSynced} Instagram posts`,
    };
  } catch (error) {
    console.error('Instagram sync error:', error);
    return { success: false, error: 'Failed to sync Instagram' };
  }
}

export async function syncFacebook() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get all Facebook page connections for this user
    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.platform, 'facebook')
        )
      );

    if (accounts.length === 0) {
      return { success: false, error: 'Facebook not connected' };
    }

    let totalSynced = 0;

    for (const account of accounts) {
      const pageId = account.platformUserId;
      const accessToken = account.accessToken;

      // Fetch videos from Facebook Page
      const videosRes = await fetch(
        `${META_GRAPH_URL}/${pageId}/videos?` +
          `fields=id,title,description,permalink_url,created_time,length,` +
          `thumbnails,views,likes.summary(true),comments.summary(true)` +
          `&limit=50` +
          `&access_token=${accessToken}`
      );

      const videosData = await videosRes.json();

      if (videosData.error) {
        console.error('Facebook API error:', videosData.error);
        continue; // Continue with other accounts
      }

      for (const video of videosData.data || []) {
        const [inserted] = await db
          .insert(content)
          .values({
            accountId: account.id,
            platform: 'facebook',
            platformVideoId: video.id,
            mediaType: 'VIDEO',
            title: video.title,
            description: video.description,
            caption: video.description,
            thumbnailUrl: video.thumbnails?.data?.[0]?.uri,
            mediaUrl: video.permalink_url,
            views: video.views || 0,
            likes: video.likes?.summary?.total_count || 0,
            comments: video.comments?.summary?.total_count || 0,
            shares: 0, // Requires additional API call
            duration: video.length,
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
              title: video.title,
              description: video.description,
              caption: null,
              platform: 'facebook',
            });
          } catch (error) {
            console.error('Embedding generation error:', error);
            // Continue even if embedding fails
          }
        }

        totalSynced++;
      }
    }

    revalidatePath('/content');
    revalidatePath('/settings');

    return {
      success: true,
      synced: totalSynced,
      message: `Synced ${totalSynced} Facebook videos`,
    };
  } catch (error) {
    console.error('Facebook sync error:', error);
    return { success: false, error: 'Failed to sync Facebook' };
  }
}
