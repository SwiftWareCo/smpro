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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FolderCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: Id<"clients">;
    parentId?: Id<"kbFolders">;
    dialogClassName?: string;
    dialogStyle?: React.CSSProperties;
}

export function FolderCreateDialog({
    open,
    onOpenChange,
    clientId,
    parentId,
    dialogClassName,
    dialogStyle,
}: FolderCreateDialogProps) {
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const createFolder = useMutation(api.knowledgeBase.createFolder);

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsCreating(true);
        try {
            await createFolder({
                clientId,
                name: name.trim(),
                parentId,
            });
            toast.success(`Folder "${name.trim()}" created`);
            setName("");
            onOpenChange(false);
        } catch {
            toast.error("Failed to create folder");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={dialogClassName ?? "sm:max-w-md"} style={dialogStyle}>
                <DialogHeader>
                    <DialogTitle>New Folder</DialogTitle>
                    <DialogDescription>
                        Create a folder to organize your documents.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Name</Label>
                        <Input
                            id="folder-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Policies, Procedures..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreate();
                            }}
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
                        disabled={!name.trim() || isCreating}
                    >
                        {isCreating ? "Creating..." : "Create Folder"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
