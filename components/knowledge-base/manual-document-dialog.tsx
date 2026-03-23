"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ManualDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: Id<"clients">;
    folderId?: Id<"kbFolders">;
}

export function ManualDocumentDialog({
    open,
    onOpenChange,
    clientId,
    folderId,
}: ManualDocumentDialogProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const createManualDocument = useMutation(
        api.knowledgeBase.createManualDocument,
    );

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) return;

        setIsCreating(true);
        try {
            await createManualDocument({
                clientId,
                title: title.trim(),
                content: content.trim(),
                description: description.trim() || undefined,
                folderId,
            });
            toast.success(`"${title.trim()}" created. Processing will begin shortly.`);
            setTitle("");
            setContent("");
            setDescription("");
            onOpenChange(false);
        } catch {
            toast.error("Failed to create document");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Document</DialogTitle>
                    <DialogDescription>
                        Create a text document to add to your knowledge base.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="doc-title">Title</Label>
                        <Input
                            id="doc-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Document title"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="doc-description">
                            Description{" "}
                            <span className="text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="doc-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="doc-content">Content</Label>
                        <Textarea
                            id="doc-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste or type your document content..."
                            rows={10}
                            className="resize-y font-mono text-sm"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={
                            !title.trim() || !content.trim() || isCreating
                        }
                    >
                        {isCreating ? "Creating..." : "Create Document"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
