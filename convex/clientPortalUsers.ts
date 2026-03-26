"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAgencyAdminUserId } from "./_lib/auth";
import {
    ClerkApiError,
    clerkCreateOrganizationMembership,
    clerkCreateUser,
    clerkGetUserByEmail,
    clerkListOrganizationMemberships,
} from "./_lib/clerkAdmin";

type PortalRole = "org:admin" | "org:member";

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function looksLikeEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAlreadyMemberError(error: ClerkApiError) {
    const code = error.details[0]?.code;
    return (
        error.status === 409 ||
        code === "duplicate_record" ||
        code === "organization_membership_exists" ||
        code === "already_exists"
    );
}

function toClerkConvexError(error: ClerkApiError) {
    return new ConvexError({
        code: "CLERK_REQUEST_FAILED",
        message:
            error.details[0]?.long_message ??
            error.details[0]?.message ??
            "Clerk request failed",
    });
}

export const addMember = action({
    args: {
        clientId: v.id("clients"),
        email: v.string(),
        role: v.union(v.literal("org:admin"), v.literal("org:member")),
        temporaryPassword: v.optional(v.string()),
    },
    returns: v.object({
        userId: v.string(),
        role: v.union(v.literal("org:admin"), v.literal("org:member")),
        createdUser: v.boolean(),
        alreadyMember: v.boolean(),
        email: v.string(),
    }),
    handler: async (ctx, args) => {
        await requireAgencyAdminUserId(ctx);
        const email = normalizeEmail(args.email);

        if (!looksLikeEmail(email)) {
            throw new ConvexError({
                code: "INVALID_EMAIL",
                message: "Please enter a valid email address",
            });
        }

        const client = await ctx.runQuery(api.clients.get, {
            clientId: args.clientId,
        });

        if (!client) {
            throw new ConvexError({
                code: "CLIENT_NOT_FOUND",
                message: "Client not found",
            });
        }

        if (!client.clerkOrganizationId) {
            throw new ConvexError({
                code: "PORTAL_NOT_PROVISIONED",
                message:
                    "This client portal is not provisioned with a Clerk organization",
            });
        }

        try {
            let user = await clerkGetUserByEmail(email);
            let createdUser = false;

            if (!user) {
                const password = args.temporaryPassword?.trim() ?? "";
                if (!password) {
                    throw new ConvexError({
                        code: "PASSWORD_REQUIRED",
                        message:
                            "Temporary password is required when creating a new portal user",
                    });
                }
                user = await clerkCreateUser({
                    email,
                    password,
                });
                createdUser = true;
            }

            let alreadyMember = false;
            await clerkCreateOrganizationMembership({
                organizationId: client.clerkOrganizationId,
                userId: user.id,
                role: args.role as PortalRole,
            });

            return {
                userId: user.id,
                role: args.role,
                createdUser,
                alreadyMember,
                email,
            };
        } catch (error) {
            if (error instanceof ConvexError) {
                throw error;
            }
            if (error instanceof ClerkApiError) {
                if (isAlreadyMemberError(error)) {
                    const user = await clerkGetUserByEmail(email);
                    if (!user) {
                        throw toClerkConvexError(error);
                    }
                    return {
                        userId: user.id,
                        role: args.role,
                        createdUser: false,
                        alreadyMember: true,
                        email,
                    };
                }
                throw toClerkConvexError(error);
            }
            if (error instanceof Error) {
                throw new ConvexError({
                    code: "CLERK_REQUEST_FAILED",
                    message: error.message,
                });
            }
            throw new ConvexError({
                code: "CLERK_REQUEST_FAILED",
                message: "Failed to update portal membership",
            });
        }
    },
});

export const listMembers = action({
    args: {
        clientId: v.id("clients"),
    },
    returns: v.array(
        v.object({
            membershipId: v.string(),
            userId: v.string(),
            role: v.union(v.literal("org:admin"), v.literal("org:member")),
            email: v.union(v.string(), v.null()),
            displayName: v.union(v.string(), v.null()),
        }),
    ),
    handler: async (ctx, args) => {
        await requireAgencyAdminUserId(ctx);
        const client = await ctx.runQuery(api.clients.get, {
            clientId: args.clientId,
        });

        if (!client) {
            throw new ConvexError({
                code: "CLIENT_NOT_FOUND",
                message: "Client not found",
            });
        }

        if (!client.clerkOrganizationId) {
            return [];
        }

        try {
            const result = await clerkListOrganizationMemberships({
                organizationId: client.clerkOrganizationId,
                limit: 100,
            });

            const mapped = (result.data ?? [])
                .filter(
                    (membership) =>
                        membership.public_user_data?.user_id &&
                        (membership.role === "org:admin" ||
                            membership.role === "org:member"),
                )
                .map((membership) => {
                    const user = membership.public_user_data!;
                    const fullName = `${user.first_name ?? ""} ${
                        user.last_name ?? ""
                    }`.trim();
                    const displayName = fullName || null;

                    return {
                        membershipId: membership.id,
                        userId: user.user_id!,
                        role: membership.role as PortalRole,
                        email: user.identifier ?? null,
                        displayName,
                    };
                })
                .sort((a, b) => {
                    const aKey = (a.displayName ?? a.email ?? "").toLowerCase();
                    const bKey = (b.displayName ?? b.email ?? "").toLowerCase();
                    return aKey.localeCompare(bKey);
                });

            return mapped;
        } catch (error) {
            if (error instanceof ClerkApiError) {
                throw toClerkConvexError(error);
            }
            if (error instanceof Error) {
                throw new ConvexError({
                    code: "CLERK_REQUEST_FAILED",
                    message: error.message,
                });
            }
            throw new ConvexError({
                code: "CLERK_REQUEST_FAILED",
                message: "Failed to load organization members",
            });
        }
    },
});
