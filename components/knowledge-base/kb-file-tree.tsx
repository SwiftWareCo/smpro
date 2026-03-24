"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KBFileTreeProps {
    clientId: Id<"clients">;
    selectedDocumentId: Id<"kbDocuments"> | null;
    onSelectDocument: (id: Id<"kbDocuments">) => void;
    onRequestUpload: () => void;
    onRequestNewFolder: (parentId?: Id<"kbFolders">) => void;
    onRequestNewDocument: (folderId?: Id<"kbFolders">) => void;
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

function DocumentLeaf({
    doc,
    isSelected,
    onClick,
    depth,
}: {
    doc: Doc<"kbDocuments">;
    isSelected: boolean;
    onClick: () => void;
    depth: number;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-primary/35 hover:bg-primary/12",
                isSelected &&
                    "border-primary/45 bg-primary/20 text-primary font-medium",
            )}
            style={{ paddingLeft: depth * 16 + 8 }}
        >
            {getFileIcon(doc.fileType, doc.sourceType)}
            <span className="min-w-0 truncate">{doc.title}</span>
            <StatusDot status={doc.processingStatus} />
        </button>
    );
}

function FolderNode({
    node,
    depth,
    expandedFolders,
    toggleFolder,
    selectedDocumentId,
    onSelectDocument,
}: {
    node: TreeFolder;
    depth: number;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    selectedDocumentId: Id<"kbDocuments"> | null;
    onSelectDocument: (id: Id<"kbDocuments">) => void;
}) {
    const isExpanded = expandedFolders.has(node.folder._id);
    const totalDocs =
        node.documents.length +
        node.children.reduce((sum, c) => sum + c.documents.length, 0);

    return (
        <div>
            <button
                onClick={() => toggleFolder(node.folder._id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-primary/35 hover:bg-primary/12"
                style={{ paddingLeft: depth * 16 + 8 }}
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
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {totalDocs}
                </span>
            </button>
            {isExpanded && (
                <div>
                    {node.children.map((child) => (
                        <FolderNode
                            key={child.folder._id}
                            node={child}
                            depth={depth + 1}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            selectedDocumentId={selectedDocumentId}
                            onSelectDocument={onSelectDocument}
                        />
                    ))}
                    {node.documents.map((doc) => (
                        <DocumentLeaf
                            key={doc._id}
                            doc={doc}
                            isSelected={selectedDocumentId === doc._id}
                            onClick={() => onSelectDocument(doc._id)}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
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
}: KBFileTreeProps) {
    const folders = useQuery(api.knowledgeBase.listFolders, { clientId });
    const documents = useQuery(api.knowledgeBase.listDocuments, { clientId });
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(),
    );

    const toggleFolder = (id: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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
            <div className="flex-1 overflow-y-auto py-1">
                {tree.roots.map((node) => (
                    <FolderNode
                        key={node.folder._id}
                        node={node}
                        depth={0}
                        expandedFolders={expandedFolders}
                        toggleFolder={toggleFolder}
                        selectedDocumentId={selectedDocumentId}
                        onSelectDocument={onSelectDocument}
                    />
                ))}
                {tree.rootDocs.map((doc) => (
                    <DocumentLeaf
                        key={doc._id}
                        doc={doc}
                        isSelected={selectedDocumentId === doc._id}
                        onClick={() => onSelectDocument(doc._id)}
                        depth={0}
                    />
                ))}
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
