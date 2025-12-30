import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { connectedAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getConnectedAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const accounts = await db
    .select({
      id: connectedAccounts.id,
      platform: connectedAccounts.platform,
      platformUsername: connectedAccounts.platformUsername,
      platformUserId: connectedAccounts.platformUserId,
      tokenExpiresAt: connectedAccounts.tokenExpiresAt,
      createdAt: connectedAccounts.createdAt,
    })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));

  return accounts;
}

export async function getAccountByPlatform(platform: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const accounts = await db
    .select({
      id: connectedAccounts.id,
      platform: connectedAccounts.platform,
      platformUsername: connectedAccounts.platformUsername,
      platformUserId: connectedAccounts.platformUserId,
      accessToken: connectedAccounts.accessToken,
      tokenExpiresAt: connectedAccounts.tokenExpiresAt,
    })
    .from(connectedAccounts)
    .where(
      and(
        eq(connectedAccounts.userId, userId),
        eq(connectedAccounts.platform, platform)
      )
    );

  return accounts;
}

export async function getAccountsByProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const accounts = await db
    .select({
      id: connectedAccounts.id,
      platform: connectedAccounts.platform,
      platformUsername: connectedAccounts.platformUsername,
      platformUserId: connectedAccounts.platformUserId,
      tokenExpiresAt: connectedAccounts.tokenExpiresAt,
      createdAt: connectedAccounts.createdAt,
    })
    .from(connectedAccounts)
    .where(
      and(
        eq(connectedAccounts.userId, userId),
        eq(connectedAccounts.projectId, projectId)
      )
    );

  return accounts;
}