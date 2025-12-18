'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { connectedAccounts, content } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function disconnectAccount(accountId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify the account belongs to the user before deleting
    const [account] = await db
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.id, accountId),
          eq(connectedAccounts.userId, userId)
        )
      );

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Delete associated content first
    await db.delete(content).where(eq(content.accountId, accountId));

    // Delete the connected account
    await db
      .delete(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId));

    revalidatePath('/content');
    revalidatePath('/settings');

    return { success: true, message: 'Account disconnected successfully' };
  } catch (error) {
    console.error('Disconnect account error:', error);
    return { success: false, error: 'Failed to disconnect account' };
  }
}

