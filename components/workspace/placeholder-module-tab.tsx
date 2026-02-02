"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface PlaceholderModuleTabProps {
    moduleType: "website_gmb" | "ai_receptionist" | "automations" | "assets";
    moduleName: string;
    description: string;
    clientId: Id<"clients">;
    enabledModules: string[];
}

export function PlaceholderModuleTab({
    moduleType,
    moduleName,
    description,
    clientId,
    enabledModules,
}: PlaceholderModuleTabProps) {
    const [isPending, setIsPending] = useState(false);
    const updateClientModules = useMutation(api.clients.updateModules);

    const handleDisable = async () => {
        setIsPending(true);
        const newModules = enabledModules.filter((m) => m !== moduleType);
        try {
            await updateClientModules({ clientId, modules: newModules });
            toast.success(`${moduleName} module disabled`);
        } catch (error) {
            console.error("Update modules error:", error);
            toast.error("Failed to disable module");
        }
        setIsPending(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{moduleName}</CardTitle>
                    <CardDescription>Coming Soon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{description}</p>
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={handleDisable}
                            disabled={isPending}
                        >
                            Disable Module
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
