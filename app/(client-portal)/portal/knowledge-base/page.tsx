"use client";

import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { usePortalClient } from "@/components/portal/portal-client-provider";
import { KBFileTree } from "@/components/knowledge-base/kb-file-tree";
import { KBDocumentPanel } from "@/components/knowledge-base/kb-document-panel";
import { KBChatOverlay } from "@/components/knowledge-base/kb-chat-overlay";
import { DocumentUpload } from "@/components/knowledge-base/document-upload";
import { FolderCreateDialog } from "@/components/knowledge-base/folder-create-dialog";
import { ManualDocumentDialog } from "@/components/knowledge-base/manual-document-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { buildTenantThemeStyle } from "@/lib/tenant-theme";

export default function PortalKnowledgeBasePage() {
    const { clientId, portalPrimaryColor, portalSecondaryColor } =
        usePortalClient();
    const { isLoading, isAuthenticated } = useConvexAuth();
    const tenantDialogStyle = buildTenantThemeStyle({
        primaryColor: portalPrimaryColor,
        secondaryColor: portalSecondaryColor,
    });

    const [selectedDocumentId, setSelectedDocumentId] =
        useState<Id<"kbDocuments"> | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [folderParentId, setFolderParentId] = useState<
        Id<"kbFolders"> | undefined
    >();
    const [manualDocDialogOpen, setManualDocDialogOpen] = useState(false);
    const [manualDocFolderId, setManualDocFolderId] = useState<
        Id<"kbFolders"> | undefined
    >();

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-7rem)]">
            {/* File tree sidebar */}
            <div className="w-64 shrink-0 border-r overflow-y-auto">
                <KBFileTree
                    clientId={clientId}
                    selectedDocumentId={selectedDocumentId}
                    onSelectDocument={setSelectedDocumentId}
                    onRequestUpload={() => setUploadDialogOpen(true)}
                    onRequestNewFolder={(parentId) => {
                        setFolderParentId(parentId);
                        setFolderDialogOpen(true);
                    }}
                    onRequestNewDocument={(folderId) => {
                        setManualDocFolderId(folderId);
                        setManualDocDialogOpen(true);
                    }}
                    dialogClassName="force-light"
                    dialogStyle={tenantDialogStyle}
                />
            </div>

            {/* Center document panel */}
            <div className="flex-1 overflow-y-auto">
                <KBDocumentPanel documentId={selectedDocumentId} />
            </div>

            {/* Floating chat overlay */}
            <KBChatOverlay clientId={clientId} />

            {/* Upload dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent
                    className="force-light sm:max-w-lg"
                    style={tenantDialogStyle}
                >
                    <DialogHeader>
                        <DialogTitle>Upload Documents</DialogTitle>
                    </DialogHeader>
                    <DocumentUpload
                        clientId={clientId}
                        onComplete={() => setUploadDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Folder create dialog */}
            <FolderCreateDialog
                open={folderDialogOpen}
                onOpenChange={setFolderDialogOpen}
                clientId={clientId}
                parentId={folderParentId}
                dialogClassName="force-light sm:max-w-md"
                dialogStyle={tenantDialogStyle}
            />

            {/* Manual document dialog */}
            <ManualDocumentDialog
                open={manualDocDialogOpen}
                onOpenChange={setManualDocDialogOpen}
                clientId={clientId}
                folderId={manualDocFolderId}
                dialogClassName="force-light sm:max-w-lg"
                dialogStyle={tenantDialogStyle}
            />
        </div>
    );
}
