"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireAgencyAdminUserId } from "./_lib/auth";
import {
    ClerkApiError,
    clerkCreateOrganization,
    clerkCreateOrganizationMembership,
    clerkCreateUser,
    clerkDeleteOrganization,
    clerkDeleteUser,
    clerkUserExistsByEmail,
} from "./_lib/clerkAdmin";
import { clientOnboardingRequestSchema } from "../lib/validation/client-onboarding";

function buildPortalUrl() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        return "/portal";
    }
    return `${appUrl.replace(/\/+$/, "")}/portal`;
}

function throwProvisioningError(
    message: string,
    code = "PROVISIONING_FAILED",
): never {
    throw new ConvexError({ code, message });
}

function mapClerkError(error: unknown): never {
    if (error instanceof ClerkApiError) {
        const first = error.details[0];
        const code = first?.code;
        const param = first?.meta?.param_name ?? first?.meta?.paramName;

        if (code === "form_identifier_exists") {
            throwProvisioningError(
                "Admin email already exists in Clerk",
                "EMAIL_ALREADY_EXISTS",
            );
        }

        if (code === "slug_taken" || param === "slug") {
            throwProvisioningError("Slug already exists", "SLUG_TAKEN");
        }

        throwProvisioningError(
            first?.long_message ??
                first?.message ??
                "Clerk provisioning request failed",
        );
    }

    if (error instanceof Error) {
        throwProvisioningError(error.message);
    }

    throwProvisioningError("Unknown provisioning error");
}

export const provisionClient = action({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        slug: v.string(),
        adminEmail: v.string(),
        adminPassword: v.string(),
        portalPrimaryColor: v.string(),
        portalSecondaryColor: v.string(),
    },
    returns: v.object({
        clientId: v.id("clients"),
        slug: v.string(),
        adminEmail: v.string(),
        portalUrl: v.string(),
        clerkOrganizationId: v.string(),
        portalAdminUserId: v.string(),
    }),
    handler: async (
        ctx,
        args,
    ): Promise<{
        clientId: Id<"clients">;
        slug: string;
        adminEmail: string;
        portalUrl: string;
        clerkOrganizationId: string;
        portalAdminUserId: string;
    }> => {
        const userId = await requireAgencyAdminUserId(ctx);

        const parsed = clientOnboardingRequestSchema.safeParse(args);
        if (!parsed.success) {
            throw new ConvexError({
                code: "VALIDATION_ERROR",
                message: parsed.error.issues[0]?.message ?? "Invalid request",
            });
        }

        const payload = parsed.data;

        const slugAvailable = await ctx.runQuery(api.clients.isSlugAvailable, {
            slug: payload.slug,
        });
        if (!slugAvailable) {
            throw new ConvexError({
                code: "SLUG_TAKEN",
                message: "Slug already exists",
            });
        }

        const emailExists = await clerkUserExistsByEmail(payload.adminEmail);
        if (emailExists) {
            throw new ConvexError({
                code: "EMAIL_ALREADY_EXISTS",
                message: "Admin email already exists in Clerk",
            });
        }

        let organizationId: string | null = null;
        let portalAdminUserId: string | null = null;

        try {
            const organization = await clerkCreateOrganization({
                name: payload.name,
                slug: payload.slug,
                createdBy: userId,
            });
            organizationId = organization.id;

            const portalAdminUser = await clerkCreateUser({
                email: payload.adminEmail,
                password: payload.adminPassword,
            });
            portalAdminUserId = portalAdminUser.id;

            await clerkCreateOrganizationMembership({
                organizationId,
                userId: portalAdminUserId,
                role: "org:admin",
            });

            const clientId: Id<"clients"> = await ctx.runMutation(
                internal.clients.createProvisioned,
                {
                    name: payload.name,
                    description: payload.description,
                    slug: payload.slug,
                    clerkOrganizationId: organizationId,
                    portalAdminUserId,
                    portalPrimaryColor: payload.portalPrimaryColor,
                    portalSecondaryColor: payload.portalSecondaryColor,
                },
            );

            return {
                clientId,
                slug: payload.slug,
                adminEmail: payload.adminEmail,
                portalUrl: buildPortalUrl(),
                clerkOrganizationId: organizationId,
                portalAdminUserId,
            };
        } catch (error) {
            if (portalAdminUserId) {
                try {
                    await clerkDeleteUser(portalAdminUserId);
                } catch {
                    // Best-effort cleanup.
                }
            }

            if (organizationId) {
                try {
                    await clerkDeleteOrganization(organizationId);
                } catch {
                    // Best-effort cleanup.
                }
            }

            mapClerkError(error);
        }
    },
});
