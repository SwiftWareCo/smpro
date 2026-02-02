"use client";

import { useQuery } from "convex/react";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceTabs } from "./workspace-tabs";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { SetupStatus } from "./setup-types";

type Client = Doc<"clients">;
type ConnectedAccount = Doc<"connectedAccounts">;

interface WorkspaceClientProps {
    clientId: Id<"clients">;
    initialClient: Client;
    initialAccounts: ConnectedAccount[];
    initialSetupStatus: SetupStatus;
    initialSeoConfigured: boolean;
}

export function WorkspaceClient({
    clientId,
    initialClient,
    initialAccounts,
    initialSetupStatus,
    initialSeoConfigured,
}: WorkspaceClientProps) {
    const client = useQuery(api.clients.get, { clientId });
    const accounts = useQuery(api.accounts.listByClient, { clientId });
    const setupStatus = useQuery(api.clients.getSetupStatus, { clientId });
    const seoSettings = useQuery(api.seo.getByClient, { clientId });

    const resolvedClient = client === undefined ? initialClient : client;
    const resolvedAccounts = accounts === undefined ? initialAccounts : accounts;
    const resolvedSetupStatus =
        setupStatus === undefined ? initialSetupStatus : setupStatus;
    const resolvedSeoConfigured =
        seoSettings === undefined
            ? initialSeoConfigured
            : Boolean(seoSettings?.websiteUrl);

    if (resolvedClient === null) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                    Client not found.
                </p>
            </div>
        );
    }

    if (!resolvedSetupStatus || !resolvedAccounts) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <Spinner className="size-6" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <WorkspaceHeader
                client={resolvedClient}
                setupStatus={resolvedSetupStatus}
            />
            <div className="flex flex-1 p-4">
                <WorkspaceTabs
                    client={resolvedClient}
                    accounts={resolvedAccounts}
                    seoConfigured={resolvedSeoConfigured}
                />
            </div>
        </div>
    );
}
