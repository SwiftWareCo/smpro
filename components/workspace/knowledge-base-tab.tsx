"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DocumentList } from "@/components/knowledge-base/document-list";
import { Loader2 } from "lucide-react";

interface KnowledgeBaseTabProps {
    clientId: Id<"clients">;
}

export function KnowledgeBaseTab({ clientId }: KnowledgeBaseTabProps) {
    const { isLoading, isAuthenticated } = useConvexAuth();

    const queryArgs =
        isAuthenticated && clientId ? { clientId } : ("skip" as const);
    const documents = useQuery(api.knowledgeBase.listDocuments, queryArgs);

    if (isLoading || !isAuthenticated || documents === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-muted-foreground">
                    {documents.length} document{documents.length !== 1 ? "s" : ""} in knowledge base.
                    Documents are managed from the client portal.
                </p>
            </div>
            <DocumentList clientId={clientId} />
        </div>
    );
}
