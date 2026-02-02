import type { UserIdentity } from 'convex/server';

export async function requireUserIdentity(ctx: {
  auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized');
  }
  return identity;
}

export async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
  const identity = await requireUserIdentity(ctx);
  return identity.subject;
}
