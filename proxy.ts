import {
    clerkClient,
    clerkMiddleware,
    createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/api/oauth/github/callback(.*)",
    "/form/(.*)",
    "/select-org(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/workspace/(.*)"]);

function hasAgencyAdminMetadata(
    publicMetadata: Record<string, unknown> | null | undefined,
) {
    const agencyAdmin = publicMetadata?.agency_admin;
    return agencyAdmin === true || agencyAdmin === "true";
}

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    const { userId, orgId } = await auth();
    const { pathname, search } = req.nextUrl;
    let clerkInstance: Awaited<ReturnType<typeof clerkClient>> | null = null;
    const getClerk = async () => {
        if (!clerkInstance) {
            clerkInstance = await clerkClient();
        }
        return clerkInstance;
    };

    let isAgencyAdminCache: boolean | null = null;
    const isAgencyAdmin = async () => {
        if (!userId) return false;
        if (isAgencyAdminCache !== null) return isAgencyAdminCache;

        const clerk = await getClerk();
        const user = await clerk.users.getUser(userId);
        isAgencyAdminCache = hasAgencyAdminMetadata(
            user.publicMetadata as Record<string, unknown> | undefined,
        );

        return isAgencyAdminCache;
    };
    let membershipCountCache: number | null = null;
    const getMembershipCount = async () => {
        if (!userId) return 0;
        if (membershipCountCache !== null) return membershipCountCache;

        const clerk = await getClerk();
        const memberships = await clerk.users.getOrganizationMembershipList({
            userId,
            // We only need to know if there is more than one.
            limit: 2,
        });
        membershipCountCache = memberships.data.length;
        return membershipCountCache;
    };

    // Root path routes users to the correct app surface.
    if (pathname === "/" && userId) {
        const agencyAdmin = await isAgencyAdmin();
        const membershipCount = await getMembershipCount();

        if (agencyAdmin && membershipCount > 1) {
            return NextResponse.redirect(new URL("/select-org", req.url));
        }

        if (agencyAdmin) {
            return NextResponse.redirect(new URL("/admin", req.url));
        }

        if (membershipCount > 1) {
            return NextResponse.redirect(new URL("/select-org", req.url));
        }

        if (orgId) {
            return NextResponse.redirect(new URL("/portal", req.url));
        }

        return NextResponse.redirect(new URL("/select-org", req.url));
    }

    // Keep old admin URLs working while canonicalizing to /admin.
    if (pathname === "/workspace" || pathname.startsWith("/workspace/")) {
        const nextPath =
            pathname === "/workspace" ? "/admin" : `/admin${pathname}`;
        const redirectUrl = new URL(nextPath, req.url);
        redirectUrl.search = search;
        return NextResponse.redirect(redirectUrl);
    }

    // Admin routes require agency_admin metadata
    if (isAdminRoute(req) && userId) {
        if (!(await isAgencyAdmin())) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    // Portal routes require an active Clerk organization
    if (req.nextUrl.pathname.startsWith("/portal")) {
        if (!orgId) {
            const selectOrgUrl = new URL("/select-org", req.url);
            return NextResponse.redirect(selectOrgUrl);
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals, static files, and Workflow internal paths
        "/((?!_next|.well-known/workflow|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
