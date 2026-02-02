import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { requireUserId } from './_lib/auth';
import * as IdeasWrite from './db/ideas/write';

export const save = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    confidence: v.number(),
    basedOnVideoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return IdeasWrite.save(ctx, userId, {
      title: args.title,
      description: args.description,
      confidence: args.confidence,
      basedOnVideoIds: args.basedOnVideoIds ?? null,
    });
  },
});
