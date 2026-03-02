import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

function slugify(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(ctx: MutationCtx, name: string) {
    const baseSlug = slugify(name) || "client";
    let slug = baseSlug;
    let suffix = 2;

    while (
        await ctx.db
            .query("clients")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .unique()
    ) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }

    return slug;
}

export async function create(
    ctx: MutationCtx,
    userId: string,
    data: { name: string; description?: string | null },
) {
    const now = Date.now();
    const slug = await generateUniqueSlug(ctx, data.name);
    const client = {
        userId,
        name: data.name,
        slug,
        clerkOrganizationId: null,
        portalPrimaryColor: null,
        portalSecondaryColor: null,
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
