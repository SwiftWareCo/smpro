import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function listByUser(ctx: QueryCtx, userId: string) {
    const clients = await ctx.db
        .query("clients")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

    return clients.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getById(ctx: QueryCtx, clientId: Id<"clients">) {
    return ctx.db.get(clientId);
}

export async function getBySlug(ctx: QueryCtx, slug: string) {
    return ctx.db
        .query("clients")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
}

export async function getByClerkOrganizationId(
    ctx: QueryCtx,
    clerkOrganizationId: string,
) {
    return ctx.db
        .query("clients")
        .withIndex("by_clerk_organization_id", (q) =>
            q.eq("clerkOrganizationId", clerkOrganizationId),
        )
        .unique();
}

export async function getByPortalAdminUserId(
    ctx: QueryCtx,
    portalAdminUserId: string,
) {
    return ctx.db
        .query("clients")
        .withIndex("by_portal_admin_user_id", (q) =>
            q.eq("portalAdminUserId", portalAdminUserId),
        )
        .unique();
}

export async function getSummary(ctx: QueryCtx, clientId: Id<"clients">) {
    const client = await getById(ctx, clientId);
    if (!client) return null;

    return {
        _id: client._id,
        avatarUrl: client.avatarUrl ?? null,
        description: client.description ?? null,
        enabledModules: client.enabledModules ?? null,
    };
}
