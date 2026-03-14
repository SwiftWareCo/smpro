import type { UserIdentity } from "convex/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import * as ClientsRead from "../db/clients/read";

export async function requireUserIdentity(ctx: {
    auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized");
    }
    return identity;
}

export async function requireUserId(ctx: {
    auth: { getUserIdentity: () => Promise<UserIdentity | null> };
}) {
    const identity = await requireUserIdentity(ctx);
    return identity.subject;
}

export async function requireOwnedClient(
    ctx: QueryCtx | MutationCtx,
    clientId: Id<"clients">,
) {
    const userId = await requireUserId(ctx);
    const client = await ClientsRead.getById(ctx, clientId);
    if (!client || client.userId !== userId) {
        throw new Error("Client not found");
    }
    return client;
}

/**
 * Checks if the current user has access to a client's data.
 * Access is granted if the user is either:
 * - The client owner (admin), OR
 * - A member of the client's Clerk organization (portal user)
 */
export async function requireClientAccess(
    ctx: QueryCtx | MutationCtx,
    clientId: Id<"clients">,
) {
    const identity = await requireUserIdentity(ctx);
    const client = await ClientsRead.getById(ctx, clientId);
    const orgId = (identity as Record<string, unknown>).org_id as
        | string
        | undefined;

    if (!client) {
        throw new Error("Client not found");
    }

    // Admin owner check
    if (client.userId === identity.subject) {
        return client;
    }

    // Portal admin check
    if (client.portalAdminUserId === identity.subject) {
        return client;
    }

    // Portal org member check
    if (
        orgId &&
        client.clerkOrganizationId &&
        orgId === client.clerkOrganizationId
    ) {
        return client;
    }

    throw new Error("Client not found");
}

export interface FormTokenResult {
    deliveryId: string;
    templateId: string;
    clientId: string;
}

/**
 * Validates a form delivery token for patient access (no Clerk auth required).
 * Returns delivery details if the token is valid and not expired.
 */
export async function requireFormToken(
    ctx: QueryCtx | MutationCtx,
    token: string,
): Promise<FormTokenResult> {
    const delivery = await ctx.db
        .query("formDeliveries")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

    if (!delivery) {
        throw new Error("Invalid form token");
    }

    if (delivery.tokenExpiresAt < Date.now()) {
        throw new Error("Form link has expired");
    }

    if (delivery.status === "completed") {
        throw new Error("This form has already been submitted");
    }

    if (delivery.status === "expired" || delivery.status === "failed") {
        throw new Error("This form link is no longer valid");
    }

    return {
        deliveryId: delivery._id,
        templateId: delivery.templateId,
        clientId: delivery.clientId,
    };
}
