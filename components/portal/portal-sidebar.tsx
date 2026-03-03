"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

type PortalSidebarProps = {
    clientName: string;
};

export function PortalSidebar({ clientName }: PortalSidebarProps) {
    const pathname = usePathname();

    return (
        <Sidebar variant="floating">
            <SidebarHeader>
                <div className="rounded-lg border border-sidebar-border bg-sidebar px-3 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4 text-sidebar-primary" />
                        <span className="truncate">{clientName}</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Portal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === "/"}
                                >
                                    <Link href="/">
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
