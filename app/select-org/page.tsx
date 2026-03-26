import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrgList } from "./org-list";

function hasAgencyAdminMetadata(
    publicMetadata: Record<string, unknown> | null | undefined,
) {
    const agencyAdmin = publicMetadata?.agency_admin;
    return agencyAdmin === true || agencyAdmin === "true";
}

export default async function SelectOrgPage() {
    const { userId, orgId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const canAccessAdmin = hasAgencyAdminMetadata(
        user.publicMetadata as Record<string, unknown> | undefined,
    );
    const memberships = await clerk.users.getOrganizationMembershipList({
        userId,
        limit: 100,
    });
    const orgCount = memberships.data.length;

    // Non-admin users with a single active org can skip the selector.
    if (!canAccessAdmin && orgCount <= 1 && orgId) {
        redirect("/portal");
    }

    const orgs = memberships.data.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        imageUrl: m.organization.imageUrl,
    }));

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Select Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {canAccessAdmin
                            ? "Choose admin console or an organization portal"
                            : "Choose which organization to access"}
                    </p>
                </div>

                <OrgList orgs={orgs} canAccessAdmin={canAccessAdmin} />
            </div>
        </div>
    );
}
