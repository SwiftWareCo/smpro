"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    FileSpreadsheet,
    FileType2,
    Pencil,
    Loader2,
    CheckCircle2,
    XCircle,
    Command,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface KBDocumentPanelProps {
    documentId: Id<"kbDocuments"> | null;
}

function getFileIcon(fileType?: string, sourceType?: string) {
    if (sourceType === "manual") {
        return <FileType2 className="h-5 w-5 text-blue-500" />;
    }
    switch (fileType) {
        case "pdf":
            return <FileText className="h-5 w-5 text-red-500" />;
        case "csv":
            return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
        case "markdown":
            return <FileType2 className="h-5 w-5 text-blue-500" />;
        default:
            return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
}

function StatusIndicator({ status }: { status: string }) {
    switch (status) {
        case "ready":
            return (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready
                </span>
            );
        case "failed":
            return (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-3 w-3" />
                    Failed
                </span>
            );
        default:
            return (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                </span>
            );
    }
}

export function KBDocumentPanel({ documentId }: KBDocumentPanelProps) {
    const doc = useQuery(
        api.knowledgeBase.getDocument,
        documentId ? { documentId } : "skip",
    );
    const updateContent = useMutation(api.knowledgeBase.updateDocumentContent);

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Reset to view mode when document changes
    useEffect(() => {
        setMode("view");
    }, [documentId]);

    const handleEdit = () => {
        if (!doc) return;
        setEditContent(doc.rawText ?? "");
        setEditTitle(doc.title);
        setMode("edit");
    };

    const handleCancel = () => {
        setMode("view");
    };

    const handleSave = useCallback(async () => {
        if (!documentId || !doc || isSaving) return;
        setIsSaving(true);
        try {
            await updateContent({
                documentId,
                rawText: editContent,
                title: editTitle !== doc.title ? editTitle : undefined,
            });
            toast.success("Document saved. Re-indexing...");
            setMode("view");
        } catch {
            toast.error("Failed to save document");
        } finally {
            setIsSaving(false);
        }
    }, [documentId, doc, editContent, editTitle, updateContent, isSaving]);

    // Ctrl/Cmd+S to save in edit mode
    useEffect(() => {
        if (mode !== "edit") return;
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [mode, handleSave]);

    // Empty state
    if (!documentId) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <FileText className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                    Select a document
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/70">
                    Press{" "}
                    <kbd className="inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                        <Command className="h-2.5 w-2.5" />K
                    </kbd>{" "}
                    to ask a question
                </p>
            </div>
        );
    }

    // Loading
    if (!doc) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Edit mode
    if (mode === "edit") {
        return (
            <div className="flex h-full flex-col">
                {/* Edit header */}
                <div className="border-b px-6 py-4">
                    <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-lg font-semibold border-none px-0 shadow-none focus-visible:ring-0"
                    />
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden px-6 py-4">
                    <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="h-full min-h-0 resize-none font-mono text-sm"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t px-6 py-3">
                    <span className="text-xs text-muted-foreground">
                        {editContent.length.toLocaleString()} characters
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving && (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            )}
                            Save & Re-index
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // View mode
    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getFileIcon(doc.fileType, doc.sourceType)}
                        <h1 className="text-lg font-semibold">{doc.title}</h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="gap-1.5"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </Button>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusIndicator status={doc.processingStatus} />
                    {doc.fileType && (
                        <>
                            <span className="text-muted-foreground/50">
                                &middot;
                            </span>
                            <span className="uppercase">{doc.fileType}</span>
                        </>
                    )}
                    {doc.charCount != null && (
                        <>
                            <span className="text-muted-foreground/50">
                                &middot;
                            </span>
                            <span>
                                {doc.charCount.toLocaleString()} chars
                            </span>
                        </>
                    )}
                    {doc.chunkCount != null && (
                        <>
                            <span className="text-muted-foreground/50">
                                &middot;
                            </span>
                            <span>{doc.chunkCount} chunks</span>
                        </>
                    )}
                </div>
                {doc.processingError && (
                    <div className="mt-2 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                        {doc.processingError}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {doc.rawText ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {doc.rawText}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            No content yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                            {doc.processingStatus === "pending" ||
                            doc.processingStatus === "extracting" ||
                            doc.processingStatus === "embedding"
                                ? "Content is being extracted..."
                                : "Click Edit to add content"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
