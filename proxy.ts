import {
    clerkClient,
    clerkMiddleware,
    createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
    getAppRootDomain,
    getRequestHost,
    resolveTenantSlugFromHost,
} from "@/lib/tenant-host";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/api/oauth/github/callback(.*)",
    "/form/(.*)",
    "/select-org(.*)",
]);

function shouldBypassTenantRewrite(pathname: string) {
    return (
        pathname.startsWith("/api") ||
        pathname.startsWith("/trpc") ||
        pathname.startsWith("/sign-in") ||
        pathname === "/form" ||
        pathname.startsWith("/form/") ||
        pathname.startsWith("/select-org")
    );
}

function hasAgencyAdminMetadata(
    publicMetadata: Record<string, unknown> | null | undefined,
) {
    const agencyAdmin = publicMetadata?.agency_admin;
    return agencyAdmin === true || agencyAdmin === "true";
}

export default clerkMiddleware(async (auth, req) => {
    const requestHost = getRequestHost(req.headers) ?? req.nextUrl.host;
    const appRootDomain = getAppRootDomain();

    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    const { userId } = await auth();

    // Admin app domain check
    if (appRootDomain && requestHost === appRootDomain && userId) {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);

        if (
            !hasAgencyAdminMetadata(
                user.publicMetadata as Record<string, unknown> | undefined,
            )
        ) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    const tenantSlug = resolveTenantSlugFromHost(requestHost);
    if (!tenantSlug) {
        return;
    }

    if (!userId) {
        return;
    }

    const clerk = await clerkClient();
    const memberships = await clerk.users.getOrganizationMembershipList({
        userId,
        limit: 100,
    });

    const isMemberOfTenant = memberships.data.some((membership) => {
        const organizationSlug = membership.organization.slug?.toLowerCase();
        return organizationSlug === tenantSlug;
    });

    if (!isMemberOfTenant) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    if (shouldBypassTenantRewrite(req.nextUrl.pathname)) {
        return;
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-tenant-slug", tenantSlug);

    const isPortalPath =
        req.nextUrl.pathname === "/portal" ||
        req.nextUrl.pathname.startsWith("/portal/");
    if (isPortalPath) {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname =
        req.nextUrl.pathname === "/"
            ? "/portal"
            : `/portal${req.nextUrl.pathname}`;

    return NextResponse.rewrite(rewriteUrl, {
        request: {
            headers: requestHeaders,
        },
    });
});

export const config = {
    matcher: [
        // Skip Next.js internals, static files, and Workflow internal paths
        "/((?!_next|.well-known/workflow|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
