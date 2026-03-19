"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    clientId: Id<"clients">;
    folderId?: Id<"kbFolders">;
    onComplete?: () => void;
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
    // Check MIME type first
    const byMime = ACCEPTED_TYPES[file.type];
    if (byMime) return byMime;

    // Fallback to extension
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return ACCEPTED_EXTENSIONS[ext] ?? null;
}

export function DocumentUpload({
    clientId,
    folderId,
    onComplete,
}: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.knowledgeBase.generateUploadUrl);
    const uploadDocument = useMutation(api.knowledgeBase.uploadDocument);

    const handleFile = useCallback((file: File) => {
        const fileType = getFileType(file);
        if (!fileType) {
            toast.error("Unsupported file type. Use PDF, Markdown, CSV, or TXT.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 10MB.");
            return;
        }
        setSelectedFile(file);
    }, []);

    const handleUpload = async () => {
        if (!selectedFile) return;

        const fileType = getFileType(selectedFile);
        if (!fileType) return;

        setIsUploading(true);
        try {
            const uploadUrl = await generateUploadUrl({ clientId });
            const res = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": selectedFile.type || "application/octet-stream" },
                body: selectedFile,
            });

            if (!res.ok) throw new Error("Failed to upload file");

            const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

            const title = selectedFile.name.replace(/\.[^.]+$/, "");
            await uploadDocument({
                clientId,
                title,
                folderId,
                storageId,
                fileType,
            });

            toast.success(`"${title}" uploaded. Processing will begin shortly.`);
            setSelectedFile(null);
            onComplete?.();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload document");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

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
                {selectedFile ? (
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div className="text-sm">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setSelectedFile(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Drag and drop a file here, or click to browse
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                            PDF, Markdown, CSV, or TXT (max 10MB)
                        </p>
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.md,.csv,.txt"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
            </div>

            {selectedFile && (
                <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                >
                    {isUploading ? "Uploading..." : "Upload Document"}
                </Button>
            )}
        </div>
    );
}
