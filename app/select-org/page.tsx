import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import {
    buildTenantPortalUrl,
    getRequestProtocol,
} from "@/lib/tenant-host";
import { Card, CardContent } from "@/components/ui/card";
import { headers } from "next/headers";

export default async function SelectOrgPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const clerk = await clerkClient();
    const memberships = await clerk.users.getOrganizationMembershipList({
        userId,
        limit: 100,
    });

    const reqHeaders = await headers();
    const protocol = getRequestProtocol(reqHeaders);

    const orgs = memberships.data.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        imageUrl: m.organization.imageUrl,
    }));

    // If only one org, redirect immediately
    if (orgs.length === 1 && orgs[0].slug) {
        redirect(buildTenantPortalUrl(orgs[0].slug, protocol));
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        Select Organization
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Choose which organization to access
                    </p>
                </div>

                <div className="space-y-3">
                    {orgs.map((org) => {
                        const href = org.slug
                            ? buildTenantPortalUrl(org.slug, protocol)
                            : "#";

                        return (
                            <a key={org.id} href={href}>
                                <Card className="cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/30">
                                    <CardContent className="flex items-center gap-4">
                                        {org.imageUrl ? (
                                            <img
                                                src={org.imageUrl}
                                                alt={org.name}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <Building2 className="h-5 w-5 text-primary" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-foreground truncate">
                                                {org.name}
                                            </p>
                                            {org.slug && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {org.slug}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>
                        );
                    })}
                </div>

                {orgs.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-8">
                            <p className="text-muted-foreground">
                                You are not a member of any organization.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
