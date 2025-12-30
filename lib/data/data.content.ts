import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { content, connectedAccounts } from '@/lib/db/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';

export async function getContent(options?: {
  platform?: string;
  limit?: number;
  clientId?: string;
  projectId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Build account query conditions
  const accountConditions = [eq(connectedAccounts.userId, userId)];

  // Filter by project if specified (preferred over clientId)
  if (options?.projectId) {
    accountConditions.push(eq(connectedAccounts.projectId, options.projectId));
  } else if (options?.clientId) {
    // Fallback to clientId for backward compatibility
    accountConditions.push(eq(connectedAccounts.clientId, options.clientId));
  }

  // Get user's connected accounts (optionally filtered by project or client)
  const userAccounts = await db
    .select({ id: connectedAccounts.id })
    .from(connectedAccounts)
    .where(and(...accountConditions));

  const accountIds = userAccounts.map((acc) => acc.id);

  if (accountIds.length === 0) {
    return [];
  }

  const conditions = [inArray(content.accountId, accountIds)];

  if (options?.platform) {
    conditions.push(eq(content.platform, options.platform));
  }

  return await db
    .select()
    .from(content)
    .where(and(...conditions))
    .orderBy(desc(content.publishedAt))
    .limit(options?.limit || 50);
}

export async function getContentByProject(projectId: string, options?: {
  platform?: string;
  limit?: number;
}) {
  return getContent({
    projectId,
    platform: options?.platform,
    limit: options?.limit,
  });
}

export async function getContentStats() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get user's connected accounts
  const userAccounts = await db
    .select({ id: connectedAccounts.id })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));

  const accountIds = userAccounts.map((acc) => acc.id);

  if (accountIds.length === 0) {
    return {
      totalContent: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    };
  }

  const result = await db
    .select({
      totalContent: sql<number>`count(*)::int`,
      totalViews: sql<number>`coalesce(sum(${content.views}), 0)::int`,
      totalLikes: sql<number>`coalesce(sum(${content.likes}), 0)::int`,
      totalComments: sql<number>`coalesce(sum(${content.comments}), 0)::int`,
      totalShares: sql<number>`coalesce(sum(${content.shares}), 0)::int`,
    })
    .from(content)
    .where(inArray(content.accountId, accountIds));

  return (
    result[0] || {
      totalContent: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    }
  );
}

export async function getTopContent(options?: {
  limit?: number;
  platform?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get user's connected accounts
  const userAccounts = await db
    .select({ id: connectedAccounts.id })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));

  const accountIds = userAccounts.map((acc) => acc.id);

  if (accountIds.length === 0) {
    return [];
  }

  const conditions = [inArray(content.accountId, accountIds)];

  if (options?.platform) {
    conditions.push(eq(content.platform, options.platform));
  }

  return await db
    .select()
    .from(content)
    .where(and(...conditions))
    .orderBy(desc(content.views))
    .limit(options?.limit || 5);
}

export async function getRecentContent(limit: number = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get user's connected accounts
  const userAccounts = await db
    .select({ id: connectedAccounts.id })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));

  const accountIds = userAccounts.map((acc) => acc.id);

  if (accountIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(content)
    .where(inArray(content.accountId, accountIds))
    .orderBy(desc(content.createdAt))
    .limit(limit);
}
