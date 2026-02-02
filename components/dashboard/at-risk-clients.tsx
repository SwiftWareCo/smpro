"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

type Client = Doc<"clients">;

interface AtRiskClientsProps {
    clients: Client[];
    setupStatuses: Record<
        string,
        { percentage: number; missingItems: string[] }
    >;
}

export function AtRiskClients({ clients, setupStatuses }: AtRiskClientsProps) {
    // Filter clients with < 50% setup
    const atRiskClients = clients.filter((client) => {
        const status = setupStatuses[client._id];
        return status && status.percentage < 50;
    });

    if (atRiskClients.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        At Risk / Missing Setup
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        All clients have good setup progress. Great job!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    At Risk / Missing Setup
                    <Badge variant="secondary" className="ml-2">
                        {atRiskClients.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {atRiskClients.slice(0, 6).map((client) => {
                        const status = setupStatuses[client._id];
                        const percentage = status?.percentage ?? 0;
                        const primaryMissing = status?.missingItems?.[0];

                        return (
                            <Link
                                key={client._id}
                                href={`/workspace/${client._id}`}
                                className="block"
                            >
                                <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage
                                            src={client.avatarUrl || ""}
                                            alt={client.name}
                                        />
                                        <AvatarFallback>
                                            {client.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {client.name}
                                        </p>
                                        {primaryMissing && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {primaryMissing}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={cn(
                                                "text-sm font-medium",
                                                percentage < 25
                                                    ? "text-red-600"
                                                    : percentage < 50
                                                      ? "text-yellow-600"
                                                      : "text-green-600",
                                            )}
                                        >
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                {atRiskClients.length > 6 && (
                    <p className="text-sm text-muted-foreground mt-3">
                        +{atRiskClients.length - 6} more clients need attention
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
