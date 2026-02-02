import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { api } from "@/convex/_generated/api";

export const metadata: Metadata = {
    title: "SM Pro Dashboard",
    description: "Social Media Content Management Platform",
};

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    const clients = await preloadQuery(
        api.clients.list,
        {},
        {
            token: token ?? undefined,
        },
    );

    return (
        <SidebarProvider>
            <AppSidebar clients={clients} />
            <SidebarInset>
                <TopBar />
                <div className="flex flex-1 flex-col">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
