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
    Folder,
    ChevronRight,
    GripVertical,
    Home,
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
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DocumentListProps {
    clientId: Id<"clients">;
    folderId?: Id<"kbFolders">;
    onFolderClick?: (folderId: Id<"kbFolders">) => void;
    onDocumentClick?: (documentId: Id<"kbDocuments">) => void;
    readOnly?: boolean;
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

function StatusBadge({
    status,
}: {
    status: Doc<"kbDocuments">["processingStatus"];
}) {
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
                <Badge
                    variant="secondary"
                    className="gap-1 text-xs text-green-700 dark:text-green-400"
                >
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

function DraggableDocumentRow({
    doc,
    readOnly,
    onClick,
}: {
    doc: Doc<"kbDocuments">;
    readOnly?: boolean;
    onClick?: () => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: doc._id,
        data: { type: "document", doc },
    });
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
        <div
            ref={setNodeRef}
            className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-opacity",
                isDragging && "opacity-50",
                onClick &&
                    "cursor-pointer hover:border-primary/35 hover:bg-primary/12",
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-3 min-w-0">
                {!readOnly && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
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
                {!readOnly && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete document?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete &quot;
                                    {doc.title}&quot; and remove it from the
                                    knowledge base. This cannot be undone.
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
                )}
            </div>
        </div>
    );
}

function DroppableFolderRow({
    folder,
    docCount,
    onClick,
}: {
    folder: Doc<"kbFolders">;
    docCount: number;
    onClick: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: folder._id,
        data: { type: "folder", folder },
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:border-primary/35 hover:bg-primary/12",
                isOver && "ring-2 ring-primary border-primary bg-primary/5",
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <Folder className="h-4 w-4 text-amber-500" />
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {folder.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {docCount} document{docCount !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
    );
}

function RootDropZone({ isVisible }: { isVisible: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: "root",
        data: { type: "root" },
    });

    if (!isVisible) return null;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-sm text-muted-foreground transition-colors",
                isOver &&
                    "ring-2 ring-primary border-primary bg-primary/5 text-foreground",
            )}
        >
            <Home className="h-4 w-4" />
            Move to root
        </div>
    );
}

export function DocumentList({
    clientId,
    folderId,
    onFolderClick,
    onDocumentClick,
    readOnly,
}: DocumentListProps) {
    const documents = useQuery(api.knowledgeBase.listDocuments, {
        clientId,
        folderId,
    });
    const subfolders = useQuery(api.knowledgeBase.listFoldersByParent, {
        clientId,
        parentId: folderId,
    });
    // Get all docs for folder doc counts
    const allDocs = useQuery(api.knowledgeBase.listDocuments, { clientId });

    const moveDocument = useMutation(api.knowledgeBase.moveDocument);
    const [isDragging, setIsDragging] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragStart = (_event: DragStartEvent) => {
        setIsDragging(true);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setIsDragging(false);
        const { active, over } = event;
        if (!over) return;

        const documentId = active.id as Id<"kbDocuments">;
        const overData = over.data.current;

        let targetFolderId: Id<"kbFolders"> | undefined;
        if (overData?.type === "folder") {
            targetFolderId = over.id as Id<"kbFolders">;
        } else if (overData?.type === "root") {
            targetFolderId = undefined;
        } else {
            return;
        }

        try {
            await moveDocument({ documentId, folderId: targetFolderId });
            toast.success("Document moved");
        } catch {
            toast.error("Failed to move document");
        }
    };

    if (documents === undefined || subfolders === undefined) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const folderDocCounts = new Map<string, number>();
    if (allDocs) {
        for (const doc of allDocs) {
            if (doc.folderId) {
                folderDocCounts.set(
                    doc.folderId,
                    (folderDocCounts.get(doc.folderId) ?? 0) + 1,
                );
            }
        }
    }

    const isEmpty = documents.length === 0 && subfolders.length === 0;

    if (isEmpty) {
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

    if (readOnly) {
        return (
            <div className="space-y-2">
                {subfolders.map((folder: Doc<"kbFolders">) => (
                    <div
                        key={folder._id}
                        className="flex items-center justify-between rounded-lg border p-3"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Folder className="h-4 w-4 text-amber-500" />
                            <p className="truncate text-sm font-medium">
                                {folder.name}
                            </p>
                        </div>
                    </div>
                ))}
                {documents.map((doc: Doc<"kbDocuments">) => (
                    <div
                        key={doc._id}
                        className="flex items-center justify-between rounded-lg border p-3"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {getFileIcon(doc.fileType)}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {doc.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {doc.fileType && (
                                        <span className="uppercase">
                                            {doc.fileType}
                                        </span>
                                    )}
                                    {doc.sourceType === "manual" && (
                                        <span>Manual</span>
                                    )}
                                    {doc.charCount != null && (
                                        <span>
                                            {doc.charCount.toLocaleString()}{" "}
                                            chars
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <StatusBadge status={doc.processingStatus} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-2">
                <RootDropZone
                    isVisible={isDragging && folderId !== undefined}
                />

                {subfolders.map((folder: Doc<"kbFolders">) => (
                    <DroppableFolderRow
                        key={folder._id}
                        folder={folder}
                        docCount={folderDocCounts.get(folder._id) ?? 0}
                        onClick={() => onFolderClick?.(folder._id)}
                    />
                ))}

                {documents.map((doc: Doc<"kbDocuments">) => (
                    <DraggableDocumentRow
                        key={doc._id}
                        doc={doc}
                        onClick={
                            onDocumentClick
                                ? () => onDocumentClick(doc._id)
                                : undefined
                        }
                    />
                ))}
            </div>
            <DragOverlay>
                {isDragging ? (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
