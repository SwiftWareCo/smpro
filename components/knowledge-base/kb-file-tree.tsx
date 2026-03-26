"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    FileText,
    FileSpreadsheet,
    FileType2,
    Upload,
    FolderPlus,
    FilePlus,
    Loader2,
    Trash2,
    Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { draggable, dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { attachClosestEdge, extractClosestEdge, type Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { isDescendantOf } from "@/lib/tree-utils";

interface KBFileTreeProps {
    clientId: Id<"clients">;
    selectedDocumentId: Id<"kbDocuments"> | null;
    onSelectDocument: (id: Id<"kbDocuments">) => void;
    onRequestUpload: () => void;
    onRequestNewFolder: (parentId?: Id<"kbFolders">) => void;
    onRequestNewDocument: (folderId?: Id<"kbFolders">) => void;
    dialogClassName?: string;
    dialogStyle?: CSSProperties;
}

interface TreeFolder {
    folder: Doc<"kbFolders">;
    children: TreeFolder[];
    documents: Doc<"kbDocuments">[];
}

function getFileIcon(fileType?: string, sourceType?: string) {
    if (sourceType === "manual") {
        return <FileType2 className="h-4 w-4 shrink-0 text-blue-500" />;
    }
    switch (fileType) {
        case "pdf":
            return <FileText className="h-4 w-4 shrink-0 text-red-500" />;
        case "csv":
            return (
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-500" />
            );
        case "markdown":
            return <FileType2 className="h-4 w-4 shrink-0 text-blue-500" />;
        default:
            return (
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            );
    }
}

function StatusDot({
    status,
}: {
    status: Doc<"kbDocuments">["processingStatus"];
}) {
    if (status === "ready") {
        return (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
        );
    }
    if (status === "failed") {
        return (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
        );
    }
    return (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500" />
    );
}

type DragState = "idle" | "dragging";
type DropState = "idle" | "over-inside" | "over-above" | "over-below";

function DocumentLeaf({
    doc,
    isSelected,
    onClick,
    depth,
    dialogClassName,
    dialogStyle,
}: {
    doc: Doc<"kbDocuments">;
    isSelected: boolean;
    onClick: () => void;
    depth: number;
    dialogClassName?: string;
    dialogStyle?: CSSProperties;
}) {
    const removeDocument = useMutation(api.knowledgeBase.removeDocument);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState>("idle");

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        return draggable({
            element: el,
            getInitialData: () => ({
                type: "document",
                documentId: doc._id,
                folderId: doc.folderId,
            }),
            onDragStart: () => setDragState("dragging"),
            onDrop: () => setDragState("idle"),
        });
    }, [doc._id, doc.folderId]);

    const handleDelete = async () => {
        try {
            await removeDocument({ documentId: doc._id });
            toast.success(`"${doc.title}" deleted`);
            setIsDeleteOpen(false);
        } catch {
            toast.error("Failed to delete document");
        }
    };

    return (
        <div
            ref={ref}
            className={cn(
                "group flex w-full items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-primary/35 hover:bg-primary/12",
                isSelected &&
                    "border-primary/45 bg-primary/20 text-primary font-medium",
                dragState === "dragging" && "opacity-50",
            )}
            style={{ paddingLeft: depth * 16 + 8 }}
        >
            <button
                onClick={onClick}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
            >
                {getFileIcon(doc.fileType, doc.sourceType)}
                <span className="min-w-0 truncate">{doc.title}</span>
                <StatusDot status={doc.processingStatus} />
            </button>
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                        title="Delete document"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </DialogTrigger>
                <DialogContent
                    className={dialogClassName}
                    style={dialogStyle}
                    showCloseButton={false}
                >
                    <DialogHeader>
                        <DialogTitle>Delete document?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete &quot;{doc.title}
                            &quot; and remove it from the knowledge base. This
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function FolderNode({
    node,
    depth,
    expandedFolders,
    toggleFolder,
    expandFolder,
    selectedDocumentId,
    onSelectDocument,
    dialogClassName,
    dialogStyle,
}: {
    node: TreeFolder;
    depth: number;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    expandFolder: (id: string) => void;
    selectedDocumentId: Id<"kbDocuments"> | null;
    onSelectDocument: (id: Id<"kbDocuments">) => void;
    dialogClassName?: string;
    dialogStyle?: CSSProperties;
}) {
    const isExpanded = expandedFolders.has(node.folder._id);
    const removeFolder = useMutation(api.knowledgeBase.removeFolder);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const totalDocs =
        node.documents.length +
        node.children.reduce((sum, c) => sum + c.documents.length, 0);

    const ref = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState>("idle");
    const [dropState, setDropState] = useState<DropState>("idle");
    const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        return combine(
            draggable({
                element: el,
                getInitialData: () => ({
                    type: "folder",
                    folderId: node.folder._id,
                    parentId: node.folder.parentId,
                }),
                onDragStart: () => setDragState("dragging"),
                onDrop: () => setDragState("idle"),
            }),
            dropTargetForElements({
                element: el,
                getData: ({ input, element }) => {
                    const data = {
                        type: "folder",
                        folderId: node.folder._id,
                        parentId: node.folder.parentId,
                    };
                    return attachClosestEdge(data, {
                        input,
                        element,
                        allowedEdges: ["top", "bottom"],
                    });
                },
                canDrop: ({ source }) => {
                    // Don't allow dropping on self
                    if (source.data.type === "folder" && source.data.folderId === node.folder._id) {
                        return false;
                    }
                    return true;
                },
                onDragEnter: ({ self, source }) => {
                    const edge = extractClosestEdge(self.data);
                    if (source.data.type === "document" || (edge === null)) {
                        setDropState("over-inside");
                    } else if (edge === "top") {
                        setDropState("over-above");
                    } else {
                        setDropState("over-below");
                    }
                    // Auto-expand collapsed folder on hover
                    if (!isExpanded) {
                        autoExpandTimerRef.current = setTimeout(() => {
                            expandFolder(node.folder._id);
                        }, 600);
                    }
                },
                onDrag: ({ self, source }) => {
                    const edge = extractClosestEdge(self.data);
                    if (source.data.type === "document" || (edge === null)) {
                        setDropState("over-inside");
                    } else if (edge === "top") {
                        setDropState("over-above");
                    } else {
                        setDropState("over-below");
                    }
                },
                onDragLeave: () => {
                    setDropState("idle");
                    if (autoExpandTimerRef.current) {
                        clearTimeout(autoExpandTimerRef.current);
                        autoExpandTimerRef.current = null;
                    }
                },
                onDrop: () => {
                    setDropState("idle");
                    if (autoExpandTimerRef.current) {
                        clearTimeout(autoExpandTimerRef.current);
                        autoExpandTimerRef.current = null;
                    }
                },
            }),
        );
    }, [node.folder._id, node.folder.parentId, isExpanded, expandFolder]);

    useEffect(() => {
        return () => {
            if (autoExpandTimerRef.current) {
                clearTimeout(autoExpandTimerRef.current);
            }
        };
    }, []);

    const handleDeleteFolder = async () => {
        try {
            await removeFolder({ folderId: node.folder._id });
            toast.success(`"${node.folder.name}" deleted`);
            setIsDeleteOpen(false);
        } catch {
            toast.error("Failed to delete folder");
        }
    };

    return (
        <div className="space-y-1">
            <div className="relative">
                {dropState === "over-above" && (
                    <div className="absolute top-0 right-0 left-0 z-10 h-0.5 bg-primary" />
                )}
                {dropState === "over-below" && (
                    <div className="absolute right-0 bottom-0 left-0 z-10 h-0.5 bg-primary" />
                )}
                <div
                    ref={ref}
                    className={cn(
                        "group flex w-full items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-primary/35 hover:bg-primary/12",
                        dragState === "dragging" && "opacity-50",
                        dropState === "over-inside" && "ring-2 ring-primary border-primary bg-primary/5",
                    )}
                    style={{ paddingLeft: depth * 16 + 8 }}
                >
                    <button
                        onClick={() => toggleFolder(node.folder._id)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        {isExpanded ? (
                            <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                        <span className="min-w-0 truncate font-medium">
                            {node.folder.name}
                        </span>
                    </button>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {totalDocs}
                    </span>
                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={(e) => e.stopPropagation()}
                                title="Delete folder"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className={dialogClassName}
                            style={dialogStyle}
                            showCloseButton={false}
                        >
                            <DialogHeader>
                                <DialogTitle>Delete folder?</DialogTitle>
                                <DialogDescription>
                                    This will delete the folder &quot;
                                    {node.folder.name}&quot;. Documents inside will
                                    be moved to the root level.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleDeleteFolder}>Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            {isExpanded && (
                <div className="space-y-1">
                    {node.children.map((child) => (
                        <FolderNode
                            key={child.folder._id}
                            node={child}
                            depth={depth + 1}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            expandFolder={expandFolder}
                            selectedDocumentId={selectedDocumentId}
                            onSelectDocument={onSelectDocument}
                            dialogClassName={dialogClassName}
                            dialogStyle={dialogStyle}
                        />
                    ))}
                    {node.documents.map((doc) => (
                        <DocumentLeaf
                            key={doc._id}
                            doc={doc}
                            isSelected={selectedDocumentId === doc._id}
                            onClick={() => onSelectDocument(doc._id)}
                            depth={depth + 1}
                            dialogClassName={dialogClassName}
                            dialogStyle={dialogStyle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function RootDropZone({ isDragging }: { isDragging: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const [isOver, setIsOver] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        return dropTargetForElements({
            element: el,
            getData: () => ({ type: "root" }),
            onDragEnter: () => setIsOver(true),
            onDragLeave: () => setIsOver(false),
            onDrop: () => setIsOver(false),
        });
    }, []);

    if (!isDragging) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-2 py-2 text-xs text-muted-foreground transition-colors",
                isOver && "ring-2 ring-primary border-primary bg-primary/5 text-foreground",
            )}
        >
            <Home className="h-3.5 w-3.5" />
            Move to root
        </div>
    );
}

export function KBFileTree({
    clientId,
    selectedDocumentId,
    onSelectDocument,
    onRequestUpload,
    onRequestNewFolder,
    onRequestNewDocument,
    dialogClassName,
    dialogStyle,
}: KBFileTreeProps) {
    const folders = useQuery(api.knowledgeBase.listFolders, { clientId });
    const documents = useQuery(api.knowledgeBase.listDocuments, { clientId });
    const moveDocumentMut = useMutation(api.knowledgeBase.moveDocument);
    const moveFolderMut = useMutation(api.knowledgeBase.moveFolder);
    const reorderFoldersMut = useMutation(api.knowledgeBase.reorderFolders);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(),
    );
    const [isDragging, setIsDragging] = useState(false);

    const toggleFolder = useCallback((id: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandFolder = useCallback((id: string) => {
        setExpandedFolders((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const tree = useMemo(() => {
        if (!folders || !documents) return { roots: [], rootDocs: [] };

        // Build folder map
        const folderMap = new Map<string, TreeFolder>();
        for (const f of folders) {
            folderMap.set(f._id, { folder: f, children: [], documents: [] });
        }

        // Assign documents to folders
        const rootDocs: Doc<"kbDocuments">[] = [];
        for (const doc of documents) {
            if (doc.folderId && folderMap.has(doc.folderId)) {
                folderMap.get(doc.folderId)!.documents.push(doc);
            } else {
                rootDocs.push(doc);
            }
        }

        // Build tree hierarchy
        const roots: TreeFolder[] = [];
        for (const node of folderMap.values()) {
            if (node.folder.parentId && folderMap.has(node.folder.parentId)) {
                folderMap.get(node.folder.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }

        // Sort folders by sortOrder, documents by newest first
        const sortChildren = (nodes: TreeFolder[]) => {
            nodes.sort((a, b) => a.folder.sortOrder - b.folder.sortOrder);
            for (const n of nodes) sortChildren(n.children);
        };
        sortChildren(roots);

        return { roots, rootDocs };
    }, [folders, documents]);

    // Monitor all drops
    useEffect(() => {
        return monitorForElements({
            onDragStart: () => setIsDragging(true),
            onDrop: ({ source, location }) => {
                setIsDragging(false);
                const target = location.current.dropTargets[0];
                if (!target) return;

                const sourceData = source.data;
                const targetData = target.data;
                const edge = extractClosestEdge(targetData);

                if (sourceData.type === "document") {
                    const documentId = sourceData.documentId as Id<"kbDocuments">;
                    let targetFolderId: Id<"kbFolders"> | undefined;

                    if (targetData.type === "folder") {
                        if (edge === "top" || edge === "bottom") {
                            // Dropping on edge of folder = move to same parent as that folder
                            targetFolderId = targetData.parentId as Id<"kbFolders"> | undefined;
                        } else {
                            // Dropping inside folder
                            targetFolderId = targetData.folderId as Id<"kbFolders">;
                        }
                    }
                    // targetData.type === "root" → targetFolderId stays undefined

                    // Skip if same folder
                    if (targetFolderId === sourceData.folderId) return;

                    moveDocumentMut({ documentId, folderId: targetFolderId })
                        .then(() => toast.success("Document moved"))
                        .catch(() => toast.error("Failed to move document"));
                } else if (sourceData.type === "folder") {
                    const folderId = sourceData.folderId as Id<"kbFolders">;

                    if (targetData.type === "root") {
                        // Move folder to root
                        if (sourceData.parentId === undefined) return;
                        moveFolderMut({ folderId, parentId: undefined })
                            .then(() => toast.success("Folder moved to root"))
                            .catch(() => toast.error("Failed to move folder"));
                    } else if (targetData.type === "folder") {
                        const targetFolderId = targetData.folderId as Id<"kbFolders">;
                        if (folderId === targetFolderId) return;

                        if (edge === "top" || edge === "bottom") {
                            // Reorder as sibling: reparent if needed, then reorder
                            const newParentId = targetData.parentId as Id<"kbFolders"> | undefined;

                            // Cycle check (client-side)
                            if (newParentId && folders && isDescendantOf(folderId as string, newParentId as string, folders)) {
                                toast.error("Cannot move a folder into its own descendant");
                                return;
                            }

                            const needsReparent = sourceData.parentId !== newParentId;

                            // Get siblings at the target level
                            const siblings = folders
                                ? folders
                                    .filter((f) => f.parentId === newParentId && f._id !== folderId)
                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                : [];

                            // Find insert position
                            const targetIndex = siblings.findIndex((f) => f._id === targetFolderId);
                            const insertAt = edge === "bottom" ? targetIndex + 1 : targetIndex;
                            const newOrder = [
                                ...siblings.slice(0, insertAt).map((f) => f._id),
                                folderId,
                                ...siblings.slice(insertAt).map((f) => f._id),
                            ];

                            const doReorder = async () => {
                                if (needsReparent) {
                                    await moveFolderMut({ folderId, parentId: newParentId });
                                }
                                await reorderFoldersMut({ folderIds: newOrder });
                                toast.success("Folder reordered");
                            };
                            doReorder().catch(() => toast.error("Failed to reorder folder"));
                        } else {
                            // Drop inside folder (reparent)
                            if (folders && isDescendantOf(folderId as string, targetFolderId as string, folders)) {
                                toast.error("Cannot move a folder into its own descendant");
                                return;
                            }
                            moveFolderMut({ folderId, parentId: targetFolderId })
                                .then(() => toast.success("Folder moved"))
                                .catch(() => toast.error("Failed to move folder"));
                        }
                    }
                }
            },
        });
    }, [folders, moveDocumentMut, moveFolderMut, reorderFoldersMut]);

    if (folders === undefined || documents === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-muted/30">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Documents
                </span>
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onRequestUpload}
                        title="Upload files"
                    >
                        <Upload className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRequestNewFolder()}
                        title="New folder"
                    >
                        <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRequestNewDocument()}
                        title="New document"
                    >
                        <FilePlus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto space-y-1 py-1">
                {tree.roots.map((node) => (
                    <FolderNode
                        key={node.folder._id}
                        node={node}
                        depth={0}
                        expandedFolders={expandedFolders}
                        toggleFolder={toggleFolder}
                        expandFolder={expandFolder}
                        selectedDocumentId={selectedDocumentId}
                        onSelectDocument={onSelectDocument}
                        dialogClassName={dialogClassName}
                        dialogStyle={dialogStyle}
                    />
                ))}
                {tree.rootDocs.map((doc) => (
                    <DocumentLeaf
                        key={doc._id}
                        doc={doc}
                        isSelected={selectedDocumentId === doc._id}
                        onClick={() => onSelectDocument(doc._id)}
                        depth={0}
                        dialogClassName={dialogClassName}
                        dialogStyle={dialogStyle}
                    />
                ))}
                <RootDropZone isDragging={isDragging} />
                {tree.roots.length === 0 && tree.rootDocs.length === 0 && (
                    <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                        No documents yet.
                        <br />
                        Upload or create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
