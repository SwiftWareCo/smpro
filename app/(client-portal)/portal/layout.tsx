import { UserButton } from "@clerk/nextjs";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalClientProvider } from "@/components/portal/portal-client-provider";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import type { Id } from "@/convex/_generated/dataModel";
import { buildTenantThemeStyle } from "@/lib/tenant-theme";
import { getPortalTenant } from "./_lib/portal-access";

export default async function TenantPortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const tenant = await getPortalTenant();

    const themeStyle = buildTenantThemeStyle({
        primaryColor: tenant.portalPrimaryColor,
        secondaryColor: tenant.portalSecondaryColor,
    });

    return (
        <div
            style={themeStyle}
            className="force-light h-svh overflow-hidden bg-background text-foreground"
        >
            <SidebarProvider
                defaultOpen={false}
                className="h-full overflow-hidden"
            >
                <PortalSidebar
                    clientName={tenant.name}
                    enabledModules={tenant.enabledModules}
                />
                <SidebarInset className="min-h-0 overflow-hidden">
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
                    <PortalClientProvider
                        clientId={tenant._id as Id<"clients">}
                        clientName={tenant.name}
                        clerkOrganizationId={tenant.clerkOrganizationId!}
                        portalPrimaryColor={tenant.portalPrimaryColor}
                        portalSecondaryColor={tenant.portalSecondaryColor}
                        enabledModules={tenant.enabledModules}
                    >
                        <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
                            {children}
                        </div>
                    </PortalClientProvider>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
