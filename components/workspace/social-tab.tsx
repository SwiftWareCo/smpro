"use client";

import { ConnectedAccountsDialog } from "@/components/social/connected-accounts-dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type ConnectedAccount = Doc<"connectedAccounts">;

interface SocialTabProps {
    clientId: Id<"clients">;
    accounts: ConnectedAccount[];
}

export function SocialTab({ clientId, accounts }: SocialTabProps) {
    const hasAccounts = accounts.length > 0;

    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Social Media</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your connected accounts and synced content
                    </p>
                </div>
                <ConnectedAccountsDialog
                    clientId={clientId}
                    accounts={accounts}
                />
            </div>

            {/* Content section */}
            {!hasAccounts ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Get Started</CardTitle>
                        <CardDescription>
                            Connect your social media accounts to start syncing
                            content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Click the &quot;Connected Accounts&quot; button
                            above to connect Instagram, Facebook, and more.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Content Feed</CardTitle>
                        <CardDescription>
                            Your synced social media content will appear here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Content feed with filtering coming soon. Use
                            &quot;Connected Accounts&quot; to sync your latest
                            posts.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
