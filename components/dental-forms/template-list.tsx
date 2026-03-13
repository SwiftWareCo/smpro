"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    FileText,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Send,
    CheckCircle,
    Archive,
} from "lucide-react";
import { TemplateEditor } from "./template-editor";
import { DeliveryDialog } from "./delivery-dialog";

interface TemplateListProps {
    clientId: Id<"clients">;
    templates: Doc<"formTemplates">[];
    readOnly?: boolean;
}

const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
};

export function TemplateList({ clientId, templates, readOnly }: TemplateListProps) {
    const [showEditor, setShowEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] =
        useState<Doc<"formTemplates"> | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<Doc<"formTemplates"> | null>(null);
    const [deliveryTemplate, setDeliveryTemplate] =
        useState<Doc<"formTemplates"> | null>(null);

    const updateTemplate = useMutation(api.formTemplates.update);
    const removeTemplate = useMutation(api.formTemplates.remove);

    const handleStatusChange = async (
        templateId: Id<"formTemplates">,
        status: "draft" | "active" | "archived",
    ) => {
        try {
            await updateTemplate({ templateId, status });
            toast.success(`Template ${status === "active" ? "activated" : status}`);
        } catch (error) {
            console.error("Status change error:", error);
            toast.error("Failed to update template status");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await removeTemplate({ templateId: deleteTarget._id });
            toast.success("Template deleted");
            setDeleteTarget(null);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete template");
        }
    };

    if (showEditor || editingTemplate) {
        return (
            <TemplateEditor
                clientId={clientId}
                template={editingTemplate}
                onClose={() => {
                    setShowEditor(false);
                    setEditingTemplate(null);
                }}
            />
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Form Templates</h3>
                        <p className="text-sm text-muted-foreground">
                            {readOnly
                                ? "View patient intake form templates"
                                : "Create and manage patient intake form templates"}
                        </p>
                    </div>
                    {!readOnly && (
                        <Button onClick={() => setShowEditor(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Template
                        </Button>
                    )}
                </div>

                {templates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                No form templates yet
                            </h3>
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {readOnly
                                    ? "No form templates have been created yet."
                                    : "Create your first patient intake form template to start collecting patient information digitally."}
                            </p>
                            {!readOnly && (
                                <Button onClick={() => setShowEditor(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Template
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {templates.map((template) => (
                            <Card key={template._id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                {template.name}
                                            </CardTitle>
                                            {template.description && (
                                                <CardDescription>
                                                    {template.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    statusColors[template.status]
                                                }
                                            >
                                                {template.status}
                                            </Badge>
                                            {!readOnly && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setEditingTemplate(
                                                                    template,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {template.status ===
                                                            "draft" && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        template._id,
                                                                        "active",
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Activate
                                                            </DropdownMenuItem>
                                                        )}
                                                        {template.status ===
                                                            "active" && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setDeliveryTemplate(
                                                                            template,
                                                                        )
                                                                    }
                                                                >
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    Send to Patient
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            template._id,
                                                                            "archived",
                                                                        )
                                                                    }
                                                                >
                                                                    <Archive className="mr-2 h-4 w-4" />
                                                                    Archive
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {template.status ===
                                                            "archived" && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        template._id,
                                                                        "draft",
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Restore to Draft
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    template,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>
                                            Version {template.version}
                                        </span>
                                        <span>
                                            {template.sections.filter(
                                                (s) => s.enabled,
                                            ).length}{" "}
                                            sections
                                        </span>
                                        <span>
                                            {template.sections
                                                .filter((s) => s.enabled)
                                                .reduce(
                                                    (acc, s) =>
                                                        acc + s.fields.length,
                                                    0,
                                                )}{" "}
                                            fields
                                        </span>
                                        <span>
                                            Updated{" "}
                                            {new Date(
                                                template.updatedAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;
                            {deleteTarget?.name}&quot;? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {deliveryTemplate && (
                <DeliveryDialog
                    open={!!deliveryTemplate}
                    onOpenChange={(open) => !open && setDeliveryTemplate(null)}
                    clientId={clientId}
                    template={deliveryTemplate}
                />
            )}
        </>
    );
}
