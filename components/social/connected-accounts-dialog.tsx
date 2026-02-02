"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, RefreshCw, Unlink } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type ConnectedAccount = Doc<"connectedAccounts">;

interface Platform {
    id: string;
    name: string;
    platforms: string[]; // Which platforms this connection covers
    color: string;
    icon: string;
    disabled?: boolean;
}

const PLATFORMS: Platform[] = [
    {
        id: "meta",
        name: "Meta (Instagram & Facebook)",
        platforms: ["instagram", "facebook"],
        color: "#1877F2",
        icon: "📘",
    },
    {
        id: "tiktok",
        name: "TikTok",
        platforms: ["tiktok"],
        color: "#00f2ea",
        icon: "♪",
        disabled: true,
    },
    {
        id: "youtube",
        name: "YouTube",
        platforms: ["youtube"],
        color: "#FF0000",
        icon: "▶",
        disabled: true,
    },
];

interface ConnectedAccountsDialogProps {
    clientId: Id<"clients">;
    accounts: ConnectedAccount[];
}

export function ConnectedAccountsDialog({
    clientId,
    accounts,
}: ConnectedAccountsDialogProps) {
    const [open, setOpen] = useState(false);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const syncInstagram = useAction(api.content.syncInstagram);
    const syncFacebook = useAction(api.content.syncFacebook);
    const disconnectAccount = useMutation(api.accounts.remove);

    const getConnectedAccounts = (platform: Platform) => {
        return accounts.filter((a) => platform.platforms.includes(a.platform));
    };

    const handleConnect = (platform: Platform) => {
        if (platform.id === "meta") {
            router.push(`/api/oauth/meta?clientId=${clientId}`);
        }
    };

    const handleSync = async (platformId: string) => {
        setSyncing(platformId);
        try {
            if (platformId === "meta") {
                const [igResult, fbResult] = await Promise.all([
                    syncInstagram({}),
                    syncFacebook({}),
                ]);

                const igSuccess = igResult?.success;
                const fbSuccess = fbResult?.success;

                if (igSuccess && fbSuccess) {
                    const totalSynced =
                        (igResult?.synced || 0) + (fbResult?.synced || 0);
                    toast.success(
                        `Synced ${totalSynced} items from Meta platforms`,
                    );
                } else if (igSuccess || fbSuccess) {
                    const synced =
                        (igResult?.synced || 0) + (fbResult?.synced || 0);
                    toast.warning(`Partially synced: ${synced} items`);
                } else {
                    toast.error("Sync failed for all platforms");
                }
            }
        } catch {
            toast.error("Sync failed");
        }
        setSyncing(null);
    };

    const handleDisconnect = async (accountId: Id<"connectedAccounts">) => {
        if (
            !confirm(
                "Disconnect this account? This will also delete all synced content.",
            )
        ) {
            return;
        }

        startTransition(async () => {
            try {
                await disconnectAccount({ accountId });
                toast.success("Account disconnected");
            } catch (error) {
                console.error("Disconnect account error:", error);
                toast.error("Failed to disconnect account");
            }
        });
    };

    const connectedCount = accounts.length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Link2 className="h-4 w-4 mr-2" />
                    Connected Accounts
                    {connectedCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {connectedCount}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Connected Accounts</DialogTitle>
                    <DialogDescription>
                        Connect your social media accounts to sync content for
                        this client.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {PLATFORMS.map((platform) => {
                        const connected = getConnectedAccounts(platform);
                        const isConnected = connected.length > 0;

                        return (
                            <Card key={platform.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                                style={{
                                                    backgroundColor:
                                                        platform.color + "20",
                                                    color: platform.color,
                                                }}
                                            >
                                                {platform.icon}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">
                                                    {platform.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {isConnected
                                                        ? `${connected.length} account${
                                                              connected.length >
                                                              1
                                                                  ? "s"
                                                                  : ""
                                                          } connected`
                                                        : "Not connected"}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                isConnected
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {isConnected
                                                ? "Connected"
                                                : "Disconnected"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Connected accounts list */}
                                    {connected.map((account) => (
                                        <div
                                            key={account._id}
                                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    @{account.platformUsername}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs capitalize"
                                                >
                                                    {account.platform}
                                                </Badge>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive/80"
                                                onClick={() =>
                                                    handleDisconnect(
                                                        account._id,
                                                    )
                                                }
                                                disabled={isPending}
                                            >
                                                <Unlink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        {isConnected && !platform.disabled && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleSync(platform.id)
                                                }
                                                disabled={
                                                    syncing === platform.id ||
                                                    isPending
                                                }
                                                className="flex-1"
                                            >
                                                <RefreshCw
                                                    className={`h-4 w-4 mr-2 ${
                                                        syncing === platform.id
                                                            ? "animate-spin"
                                                            : ""
                                                    }`}
                                                />
                                                {syncing === platform.id
                                                    ? "Syncing..."
                                                    : "Sync"}
                                            </Button>
                                        )}

                                        {!platform.disabled && (
                                            <Button
                                                variant={
                                                    isConnected
                                                        ? "outline"
                                                        : "default"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    handleConnect(platform)
                                                }
                                                disabled={isPending}
                                                className="flex-1"
                                            >
                                                {isConnected
                                                    ? "Add Another"
                                                    : "Connect"}
                                            </Button>
                                        )}

                                        {platform.disabled && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="flex-1"
                                            >
                                                Coming Soon
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
