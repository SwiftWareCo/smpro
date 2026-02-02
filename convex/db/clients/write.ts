import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function create(
    ctx: MutationCtx,
    userId: string,
    data: { name: string; description?: string | null },
) {
    const now = Date.now();
    const client = {
        userId,
        name: data.name,
        description: data.description ?? null,
        avatarUrl: null,
        status: "active",
        enabledModules: ["social"],
        createdAt: now,
        updatedAt: now,
    };

    const clientId = await ctx.db.insert("clients", client);
    return ctx.db.get(clientId);
}

export async function patchById(
    ctx: MutationCtx,
    clientId: Id<"clients">,
    patch: Record<string, unknown>,
) {
    const client = await ctx.db.get(clientId);

    if (!client) return null;

    await ctx.db.patch(client._id, patch);
    return client;
}

export async function removeById(ctx: MutationCtx, clientId: Id<"clients">) {
    const client = await ctx.db.get(clientId);

    if (!client) return null;

    await ctx.db.delete(client._id);
    return client;
}
