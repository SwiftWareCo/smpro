"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookOpen,
    Building2,
    ClipboardList,
    LayoutDashboard,
} from "lucide-react";
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
    enabledModules?: string[];
};

const menuButtonClassName =
    "hover:border-sidebar-primary/20 hover:bg-sidebar-primary/10 data-[active=true]:border-sidebar-primary/30 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0";

export function PortalSidebar({
    clientName,
    enabledModules = [],
}: PortalSidebarProps) {
    const pathname = usePathname();
    const hasPatientFormsModule = enabledModules.includes("patient_forms");
    const hasKnowledgeBaseModule = enabledModules.includes("knowledge_base");

    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader>
                <div className="rounded-lg border border-sidebar-border bg-sidebar px-3 py-3 group-data-[collapsible=icon]:px-2">
                    <div className="flex items-center gap-2 text-sm font-medium group-data-[collapsible=icon]:justify-center">
                        <Building2 className="h-4 w-4 text-sidebar-primary" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                            {clientName}
                        </span>
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
                                    isActive={pathname === "/portal"}
                                    tooltip="Dashboard"
                                    className={menuButtonClassName}
                                >
                                    <Link href="/portal">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {hasPatientFormsModule && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            pathname === "/portal/forms" ||
                                            pathname.startsWith(
                                                "/portal/forms/",
                                            )
                                        }
                                        tooltip="Patient Forms"
                                        className={menuButtonClassName}
                                    >
                                        <Link href="/portal/forms">
                                            <ClipboardList className="h-4 w-4" />
                                            <span>Patient Forms</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {hasKnowledgeBaseModule && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            pathname ===
                                                "/portal/knowledge-base" ||
                                            pathname.startsWith(
                                                "/portal/knowledge-base/",
                                            )
                                        }
                                        tooltip="Knowledge Base"
                                        className={menuButtonClassName}
                                    >
                                        <Link href="/portal/knowledge-base">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Knowledge Base</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
