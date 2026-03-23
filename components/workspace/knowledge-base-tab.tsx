"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DocumentList } from "@/components/knowledge-base/document-list";
import {
    Loader2,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Hash,
    Folder,
} from "lucide-react";

interface KnowledgeBaseTabProps {
    clientId: Id<"clients">;
}

function formatChars(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
}

export function KnowledgeBaseTab({ clientId }: KnowledgeBaseTabProps) {
    const { isLoading, isAuthenticated } = useConvexAuth();

    const queryArgs =
        isAuthenticated && clientId ? { clientId } : ("skip" as const);
    const stats = useQuery(api.knowledgeBase.getStats, queryArgs);

    if (isLoading || !isAuthenticated || stats === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Total Documents
                    </div>
                    <p className="mt-1 text-2xl font-semibold">
                        {stats.totalDocuments}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {stats.ready}
                        </span>
                        {stats.pending > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3" />
                                {stats.pending}
                            </span>
                        )}
                        {stats.failed > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-3 w-3" />
                                {stats.failed}
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        Total Characters
                    </div>
                    <p className="mt-1 text-2xl font-semibold">
                        {formatChars(stats.totalChars)}
                    </p>
                </div>

                <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Folder className="h-4 w-4" />
                        Folders
                    </div>
                    <p className="mt-1 text-2xl font-semibold">
                        {stats.folderCount}
                    </p>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                Documents are managed from the client portal.
            </p>

            <DocumentList clientId={clientId} readOnly />
        </div>
    );
}
