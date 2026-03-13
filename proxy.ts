import {
    clerkClient,
    clerkMiddleware,
    createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveTenantSlugFromHost } from "@/lib/tenant-host";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/api/oauth/github/callback(.*)",
    "/form/(.*)",
]);

function shouldBypassTenantRewrite(pathname: string) {
    return (
        pathname.startsWith("/api") ||
        pathname.startsWith("/trpc") ||
        pathname.startsWith("/sign-in") ||
        pathname === "/form" ||
        pathname.startsWith("/form/")
    );
}

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    const rawHost =
        req.headers.get("x-forwarded-host") ??
        req.headers.get("host") ??
        req.nextUrl.host;
    const tenantSlug = resolveTenantSlugFromHost(rawHost);
    if (!tenantSlug) {
        return;
    }

    const { userId } = await auth();
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
