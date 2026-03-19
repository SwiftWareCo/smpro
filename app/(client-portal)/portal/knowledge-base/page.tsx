"use client";

import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { usePortalClient } from "@/components/portal/portal-client-provider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentList } from "@/components/knowledge-base/document-list";
import { DocumentUpload } from "@/components/knowledge-base/document-upload";
import { KBChat } from "@/components/knowledge-base/kb-chat";
import { FolderCreateDialog } from "@/components/knowledge-base/folder-create-dialog";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function PortalKnowledgeBasePage() {
    const { clientId } = usePortalClient();
    const [tab, setTab] = useState("documents");
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const { isLoading, isAuthenticated } = useConvexAuth();

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Knowledge Base
                </h1>
                <p className="text-sm text-muted-foreground">
                    Upload documents and ask questions about your data.
                </p>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="gap-4">
                <TabsList className="rounded-2xl bg-background/80 backdrop-blur">
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="chat">Ask Questions</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="mt-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Upload</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFolderDialogOpen(true)}
                        >
                            <FolderPlus className="mr-2 h-4 w-4" />
                            New Folder
                        </Button>
                    </div>

                    <DocumentUpload clientId={clientId} />

                    <div>
                        <h2 className="mb-3 text-lg font-medium">Documents</h2>
                        <DocumentList clientId={clientId} />
                    </div>

                    <FolderCreateDialog
                        open={folderDialogOpen}
                        onOpenChange={setFolderDialogOpen}
                        clientId={clientId}
                    />
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                    <KBChat clientId={clientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
