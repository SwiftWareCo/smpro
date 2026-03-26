"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppBreadcrumbs } from "@/components/dashboard/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import ModeToggle from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

export function TopBar() {
    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <SidebarTrigger className="-ml-1" />
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
            />
            <AppBreadcrumbs />
            <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/select-org">
                        <ArrowRightLeft className="size-4" />
                        Switch
                    </Link>
                </Button>
                <ModeToggle />
                <UserButton />
            </div>
        </header>
    );
}
