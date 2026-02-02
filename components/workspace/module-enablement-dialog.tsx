"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ModuleEnablementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: Id<"clients">;
    enabledModules?: string[];
    children?: ReactNode;
}

const availableModules = [
    {
        type: "social" as const,
        name: "Social",
        description: "Manage social media accounts and content",
    },
    {
        type: "seo" as const,
        name: "SEO",
        description: "SEO settings and optimization",
    },
    {
        type: "autoblog" as const,
        name: "Auto-Blog",
        description: "AI-powered blog automation with MDX publishing",
    },
    {
        type: "website_gmb" as const,
        name: "Website/GMB",
        description: "Website and Google My Business management",
    },
    {
        type: "ai_receptionist" as const,
        name: "AI Receptionist",
        description: "AI-powered call handling and automation",
    },
    {
        type: "automations" as const,
        name: "Automations",
        description: "Workflow automation and scheduling",
    },
    {
        type: "assets" as const,
        name: "Assets",
        description: "Brand assets and media library",
    },
];

export function ModuleEnablementDialog({
    open,
    onOpenChange,
    clientId,
    enabledModules = [],
    children,
}: ModuleEnablementDialogProps) {
    const [isPending, setIsPending] = useState<Record<string, boolean>>({});
    const [localEnabledModules, setLocalEnabledModules] =
        useState<string[]>(enabledModules);
    const updateClientModules = useMutation(api.clients.updateModules);

    useEffect(() => {
        setLocalEnabledModules(enabledModules);
    }, [enabledModules]);

    // Build module states from localEnabledModules
    const getModuleState = (moduleType: string) => {
        return localEnabledModules.includes(moduleType);
    };

    const handleToggle = async (moduleType: string, nextState: boolean) => {
        setIsPending((prev) => ({ ...prev, [moduleType]: true }));

        // Toggle module in the array
        const newModules = nextState
            ? [...localEnabledModules, moduleType]
            : localEnabledModules.filter((m) => m !== moduleType);
        setLocalEnabledModules(newModules);

        try {
            await updateClientModules({ clientId, modules: newModules });
            toast.success(
                `${availableModules.find((m) => m.type === moduleType)?.name} module ${
                    nextState ? "enabled" : "disabled"
                }`,
            );
        } catch (error) {
            console.error("Update modules error:", error);
            toast.error("Failed to update module");
            setLocalEnabledModules(enabledModules);
        }

        setIsPending((prev) => ({ ...prev, [moduleType]: false }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Modules</DialogTitle>
                    <DialogDescription>
                        Enable or disable modules for this client
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {availableModules.map((module) => {
                        const isEnabled = getModuleState(module.type);
                        const pending = isPending[module.type] ?? false;

                        return (
                            <div
                                key={module.type}
                                className="flex items-center justify-between space-x-2"
                            >
                                <div className="flex-1 space-y-1">
                                    <Label
                                        htmlFor={module.type}
                                        className="text-sm font-medium"
                                    >
                                        {module.name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {module.description}
                                    </p>
                                </div>
                                <Switch
                                    id={module.type}
                                    checked={isEnabled}
                                    onCheckedChange={(checked) =>
                                        handleToggle(module.type, checked)
                                    }
                                    disabled={pending}
                                />
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
