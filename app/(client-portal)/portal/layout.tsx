import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { fetchQuery } from "convex/nextjs";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalClientProvider } from "@/components/portal/portal-client-provider";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildTenantThemeStyle } from "@/lib/tenant-theme";

export default async function TenantPortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const requestHeaders = await headers();
    const tenantSlug = requestHeaders.get("x-tenant-slug");

    if (!tenantSlug) {
        notFound();
    }

    const { userId, getToken } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const token = (await getToken({ template: "convex" })) ?? undefined;
    const convexOptions = { token };

    const tenant = await fetchQuery(
        api.clients.getPortalBySlug,
        { slug: tenantSlug },
        convexOptions,
    );

    if (!tenant || !tenant.clerkOrganizationId) {
        notFound();
    }

    const themeStyle = buildTenantThemeStyle({
        primaryColor: tenant.portalPrimaryColor,
        secondaryColor: tenant.portalSecondaryColor,
    });

    return (
        <div
            style={themeStyle}
            className="min-h-svh bg-background text-foreground"
        >
            <SidebarProvider>
                <PortalSidebar clientName={tenant.name} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <div className="text-sm text-muted-foreground">
                            Client Portal
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            <span className="hidden text-sm font-medium md:inline">
                                {tenant.name}
                            </span>
                            <UserButton />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col p-4 md:p-6">
                        <PortalClientProvider
                            clientId={tenant._id as Id<"clients">}
                            clientName={tenant.name}
                        >
                            {children}
                        </PortalClientProvider>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
