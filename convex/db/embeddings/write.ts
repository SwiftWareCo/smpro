import type { MutationCtx } from "../../_generated/server";

export async function insertMany(
    ctx: MutationCtx,
    resourceId: string,
    contents: string[],
    embeddings: number[][],
) {
    for (let i = 0; i < embeddings.length; i++) {
        await ctx.db.insert("embeddings", {
            resourceId,
            content: contents[i] ?? "",
            embedding: embeddings[i],
        } as any);
    }
    return { success: true };
}
