import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { connectedAccounts } from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env.mjs';

const META_GRAPH_URL = 'https://graph.facebook.com/v24.0';

export async function GET(req: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Parse state to get clientId for redirect
  let clientId: string | null = null;
  let stateData: { userId: string; clientId?: string } | null = null;

  if (state) {
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      clientId = stateData?.clientId || null;
    } catch {
      // State parsing failed
    }
  }

  // Helper to build redirect URL
  const buildRedirect = (path: string, params: Record<string, string>) => {
    const url = new URL(path, env.NEXT_PUBLIC_APP_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.pathname + url.search;
  };

  // Redirect destination based on clientId
  const getErrorRedirect = (errorType: string) => {
    if (clientId) {
      return buildRedirect(`/workspace/${clientId}`, {
        tab: 'social',
        error: errorType,
      });
    }
    return `/?error=${errorType}`;
  };

  const getSuccessRedirect = () => {
    if (clientId) {
      return buildRedirect(`/workspace/${clientId}`, {
        tab: 'social',
        success: 'meta',
      });
    }
    return `/?success=meta`;
  };

  // Handle user denial
  if (error) {
    console.error('OAuth error:', searchParams.get('error_description'));
    redirect(getErrorRedirect('denied'));
  }

  // Verify state
  if (!state || !userId) {
    redirect(getErrorRedirect('invalid_state'));
  }

  if (!stateData || stateData.userId !== userId) {
    redirect(getErrorRedirect('unauthorized'));
  }

  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`;

  // Step 1: Exchange code for Business Integration System User Access Token
  const tokenUrl = new URL(`${META_GRAPH_URL}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', env.META_APP_ID);
  tokenUrl.searchParams.set('client_secret', env.META_APP_SECRET);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code!);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    console.error('Token exchange error:', tokenData.error);
    redirect(getErrorRedirect('token_exchange'));
  }

  const accessToken = tokenData.access_token;

  // Step 2: Get client_business_id from /me endpoint
  const meRes = await fetch(
    `${META_GRAPH_URL}/me?fields=client_business_id&access_token=${accessToken}`
  );
  const meData = await meRes.json();

  if (meData.error) {
    console.error('Failed to get client business ID:', meData.error);
    redirect(getErrorRedirect('business_id'));
  }

  const clientBusinessId = meData.client_business_id;

  // Step 3: Get Facebook Pages the user manages
  const pagesRes = await fetch(
    `${META_GRAPH_URL}/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesRes.json();

  if (!pagesData.data || pagesData.data.length === 0) {
    redirect(getErrorRedirect('no_pages'));
  }

  // Step 4: For each page, check if it has an Instagram account
  for (const page of pagesData.data) {
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    // Save Facebook Page connection with clientId
    await db
      .insert(connectedAccounts)
      .values({
        userId,
        clientId, // Link to specific client
        platform: 'facebook',
        accessToken: pageAccessToken,
        platformUserId: pageId,
        platformUsername: pageName,
        clientBusinessId,
        tokenExpiresAt: null,
      })
      .onConflictDoUpdate({
        target: [
          connectedAccounts.userId,
          connectedAccounts.platform,
          connectedAccounts.platformUserId,
        ],
        set: {
          clientId, // Update clientId if reconnecting
          accessToken: pageAccessToken,
          platformUsername: pageName,
          clientBusinessId,
          tokenExpiresAt: null,
          updatedAt: new Date(),
        },
      });

    // Check for connected Instagram Business account
    const igRes = await fetch(
      `${META_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igData = await igRes.json();

    if (igData.instagram_business_account) {
      const igAccountId = igData.instagram_business_account.id;

      // Get Instagram account details
      const igDetailsRes = await fetch(
        `${META_GRAPH_URL}/${igAccountId}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${pageAccessToken}`
      );
      const igDetails = await igDetailsRes.json();

      // Save Instagram connection with clientId
      await db
        .insert(connectedAccounts)
        .values({
          userId,
          clientId, // Link to specific client
          platform: 'instagram',
          accessToken: pageAccessToken,
          platformUserId: igAccountId,
          platformUsername: igDetails.username,
          clientBusinessId,
          tokenExpiresAt: null,
        })
        .onConflictDoUpdate({
          target: [
            connectedAccounts.userId,
            connectedAccounts.platform,
            connectedAccounts.platformUserId,
          ],
          set: {
            clientId, // Update clientId if reconnecting
            accessToken: pageAccessToken,
            platformUsername: igDetails.username,
            clientBusinessId,
            tokenExpiresAt: null,
            updatedAt: new Date(),
          },
        });
    }
  }

  redirect(getSuccessRedirect());
}
