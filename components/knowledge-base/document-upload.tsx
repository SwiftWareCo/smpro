"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    clientId: Id<"clients">;
    folderId?: Id<"kbFolders">;
    onComplete?: () => void;
}

type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueuedFile {
    file: File;
    fileType: "pdf" | "markdown" | "csv" | "txt";
    status: FileStatus;
    error?: string;
}

const ACCEPTED_TYPES: Record<string, "pdf" | "markdown" | "csv" | "txt"> = {
    "application/pdf": "pdf",
    "text/markdown": "markdown",
    "text/csv": "csv",
    "text/plain": "txt",
};

const ACCEPTED_EXTENSIONS: Record<string, "pdf" | "markdown" | "csv" | "txt"> = {
    ".pdf": "pdf",
    ".md": "markdown",
    ".csv": "csv",
    ".txt": "txt",
};

function getFileType(file: File): "pdf" | "markdown" | "csv" | "txt" | null {
    const byMime = ACCEPTED_TYPES[file.type];
    if (byMime) return byMime;
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return ACCEPTED_EXTENSIONS[ext] ?? null;
}

function FileStatusIcon({ status }: { status: FileStatus }) {
    switch (status) {
        case "pending":
            return null;
        case "uploading":
            return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
        case "done":
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case "error":
            return <XCircle className="h-4 w-4 text-destructive" />;
    }
}

export function DocumentUpload({
    clientId,
    folderId,
    onComplete,
}: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [files, setFiles] = useState<QueuedFile[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.knowledgeBase.generateUploadUrl);
    const uploadDocument = useMutation(api.knowledgeBase.uploadDocument);

    const addFiles = useCallback((fileList: FileList | File[]) => {
        const newFiles: QueuedFile[] = [];
        for (const file of fileList) {
            const fileType = getFileType(file);
            if (!fileType) {
                toast.error(`"${file.name}" — unsupported file type`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`"${file.name}" — exceeds 10MB limit`);
                continue;
            }
            newFiles.push({ file, fileType, status: "pending" });
        }
        if (newFiles.length > 0) {
            setFiles((prev) => [...prev, ...newFiles]);
        }
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleUploadAll = async () => {
        if (files.length === 0) return;
        setIsUploading(true);

        let doneCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            if (files[i].status === "done") {
                doneCount++;
                continue;
            }

            setFiles((prev) =>
                prev.map((f, idx) =>
                    idx === i ? { ...f, status: "uploading" } : f,
                ),
            );

            try {
                const uploadUrl = await generateUploadUrl({ clientId });
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            files[i].file.type || "application/octet-stream",
                    },
                    body: files[i].file,
                });

                if (!res.ok) throw new Error("Upload failed");

                const { storageId } = (await res.json()) as {
                    storageId: Id<"_storage">;
                };

                const title = files[i].file.name.replace(/\.[^.]+$/, "");
                await uploadDocument({
                    clientId,
                    title,
                    folderId,
                    storageId,
                    fileType: files[i].fileType,
                });

                setFiles((prev) =>
                    prev.map((f, idx) =>
                        idx === i ? { ...f, status: "done" } : f,
                    ),
                );
                doneCount++;
            } catch (error) {
                const msg =
                    error instanceof Error ? error.message : "Upload failed";
                setFiles((prev) =>
                    prev.map((f, idx) =>
                        idx === i ? { ...f, status: "error", error: msg } : f,
                    ),
                );
                errorCount++;
            }
        }

        setIsUploading(false);

        if (errorCount === 0) {
            toast.success(
                `${doneCount} file${doneCount !== 1 ? "s" : ""} uploaded`,
            );
            setFiles([]);
        } else {
            toast.error(
                `${doneCount} uploaded, ${errorCount} failed`,
            );
        }
        onComplete?.();
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
        },
        [addFiles],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const pendingCount = files.filter((f) => f.status === "pending").length;

    return (
        <div className="space-y-3">
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                    isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50",
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    PDF, Markdown, CSV, or TXT (max 10MB each)
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.md,.csv,.txt"
                    multiple
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                        if (e.target.files) addFiles(e.target.files);
                        e.target.value = "";
                    }}
                />
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((qf, i) => (
                        <div
                            key={`${qf.file.name}-${i}`}
                            className="flex items-center gap-3 rounded-md border px-3 py-2"
                        >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {qf.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(qf.file.size / 1024).toFixed(1)} KB
                                    {qf.error && (
                                        <span className="ml-2 text-destructive">
                                            {qf.error}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <FileStatusIcon status={qf.status} />
                            {qf.status === "pending" && !isUploading && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeFile(i)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {pendingCount > 0 && (
                        <Button
                            onClick={handleUploadAll}
                            disabled={isUploading}
                            className="w-full"
                        >
                            {isUploading
                                ? "Uploading..."
                                : `Upload ${pendingCount} file${pendingCount !== 1 ? "s" : ""}`}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
