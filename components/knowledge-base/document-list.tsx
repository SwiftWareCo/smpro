"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Loader2,
    CheckCircle2,
    XCircle,
    Trash2,
    FileSpreadsheet,
    FileType2,
} from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DocumentListProps {
    clientId: Id<"clients">;
    folderId?: Id<"kbFolders">;
}

function getFileIcon(fileType?: string) {
    switch (fileType) {
        case "pdf":
            return <FileText className="h-4 w-4 text-red-500" />;
        case "csv":
            return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
        case "markdown":
            return <FileType2 className="h-4 w-4 text-blue-500" />;
        default:
            return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
}

function StatusBadge({ status }: { status: Doc<"kbDocuments">["processingStatus"] }) {
    switch (status) {
        case "pending":
        case "extracting":
        case "embedding":
            return (
                <Badge variant="secondary" className="gap-1 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {status === "pending"
                        ? "Queued"
                        : status === "extracting"
                          ? "Extracting"
                          : "Embedding"}
                </Badge>
            );
        case "ready":
            return (
                <Badge variant="secondary" className="gap-1 text-xs text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready
                </Badge>
            );
        case "failed":
            return (
                <Badge variant="destructive" className="gap-1 text-xs">
                    <XCircle className="h-3 w-3" />
                    Failed
                </Badge>
            );
    }
}

function DocumentRow({ doc }: { doc: Doc<"kbDocuments"> }) {
    const removeDocument = useMutation(api.knowledgeBase.removeDocument);

    const handleDelete = async () => {
        try {
            await removeDocument({ documentId: doc._id });
            toast.success(`"${doc.title}" deleted`);
        } catch {
            toast.error("Failed to delete document");
        }
    };

    return (
        <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(doc.fileType)}
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {doc.fileType && (
                            <span className="uppercase">{doc.fileType}</span>
                        )}
                        {doc.sourceType === "manual" && <span>Manual</span>}
                        {doc.charCount != null && (
                            <span>{doc.charCount.toLocaleString()} chars</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={doc.processingStatus} />
                {doc.processingStatus === "failed" && doc.processingError && (
                    <span
                        className="max-w-[200px] truncate text-xs text-destructive"
                        title={doc.processingError}
                    >
                        {doc.processingError}
                    </span>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete document?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete &quot;{doc.title}&quot; and
                                remove it from the knowledge base. This cannot be
                                undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

export function DocumentList({ clientId, folderId }: DocumentListProps) {
    const documents = useQuery(api.knowledgeBase.listDocuments, {
        clientId,
        folderId,
    });

    if (documents === undefined) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                    No documents yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    Upload a PDF, Markdown, CSV, or TXT file to get started
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {documents.map((doc) => (
                <DocumentRow key={doc._id} doc={doc} />
            ))}
        </div>
    );
}
