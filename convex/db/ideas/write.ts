import type { MutationCtx } from "../../_generated/server";

export async function save(
    ctx: MutationCtx,
    userId: string,
    args: {
        title: string;
        description: string;
        confidence: number;
        basedOnVideoIds?: string[] | null;
    },
) {
    const now = Date.now();
    const ideaId = await ctx.db.insert("savedIdeas", {
        userId,
        title: args.title,
        description: args.description,
        confidence: args.confidence,
        basedOnVideoIds: args.basedOnVideoIds ?? null,
        isTrending: false,
        createdAt: now,
    });
    return ctx.db.get(ideaId);
}
