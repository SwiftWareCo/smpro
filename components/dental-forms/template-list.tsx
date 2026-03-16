"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Copy,
    Eye,
    FileText,
    Plus,
    Pencil,
    Trash2,
    Send,
    CheckCircle,
    Languages,
    Loader2,
    CircleAlert,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormRenderer } from "@/components/patient-form/form-renderer";
import { TemplateEditor } from "./template-editor";
import { DeliveryDialog } from "./delivery-dialog";
import { formatProjectDate, formatProjectDateTime } from "@/lib/date-utils";

interface TemplateListProps {
    clientId: Id<"clients">;
    templates: Doc<"formTemplates">[];
    readOnly?: boolean;
    copyVariant?: "template" | "form";
    clientName?: string;
}

const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
};

const LANGUAGE_LABELS: Record<string, string> = {
    es: "Spanish",
    ar: "Arabic",
    "zh-Hans": "Simplified Chinese",
    "zh-Hant": "Traditional Chinese",
};

export function TemplateList({
    clientId,
    templates,
    readOnly,
    copyVariant = "template",
    clientName,
}: TemplateListProps) {
    const [showEditor, setShowEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] =
        useState<Doc<"formTemplates"> | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<Doc<"formTemplates"> | null>(null);
    const [translateTarget, setTranslateTarget] =
        useState<Doc<"formTemplates"> | null>(null);
    const [deliveryTemplate, setDeliveryTemplate] =
        useState<Doc<"formTemplates"> | null>(null);
    const [deliveryOpen, setDeliveryOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] =
        useState<Doc<"formTemplates"> | null>(null);

    const updateTemplate = useMutation(api.formTemplates.update);
    const removeTemplate = useMutation(api.formTemplates.remove);
    const retranslateTemplate = useMutation(api.formTemplates.retranslate);
    const createTemplate = useMutation(api.formTemplates.create);

    const openTemplateEditor = (template: Doc<"formTemplates">) => {
        setEditingTemplate(template);
    };

    const stopCardClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
    };

    const handleCardKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
        template: Doc<"formTemplates">,
    ) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openTemplateEditor(template);
    };

    const handleStatusChange = async (
        templateId: Id<"formTemplates">,
        status: "draft" | "active",
    ) => {
        try {
            await updateTemplate({ templateId, status });
            toast.success(
                `${copyVariant === "form" ? "Form" : "Template"} ${
                    status === "active" ? "activated" : status
                }`,
            );
        } catch (error) {
            console.error("Status change error:", error);
            toast.error(
                `Failed to update ${copyVariant === "form" ? "form" : "template"} status`,
            );
        }
    };

    const handleRetranslate = async (templateId: Id<"formTemplates">) => {
        try {
            await retranslateTemplate({ templateId });
            toast.success("Translation started — this may take a moment");
            setTranslateTarget(null);
        } catch (error) {
            console.error("Retranslate error:", error);
            toast.error("Failed to start translation");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await removeTemplate({ templateId: deleteTarget._id });
            toast.success(
                `${copyVariant === "form" ? "Form" : "Template"} deleted`,
            );
            setDeleteTarget(null);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(
                `Failed to delete ${copyVariant === "form" ? "form" : "template"}`,
            );
        }
    };

    const handleDuplicate = async (template: Doc<"formTemplates">) => {
        try {
            const clonedSections = template.sections.map((section) => ({
                ...section,
                id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                fields: section.fields.map((field) => ({
                    ...field,
                    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                })),
            }));
            await createTemplate({
                clientId,
                name: `${template.name} (Copy)`,
                description: template.description ?? undefined,
                sections: clonedSections,
                consentText: template.consentText,
                consentVersion: template.consentVersion,
            });
            toast.success(
                `${copyVariant === "form" ? "Form" : "Template"} duplicated`,
            );
        } catch (error) {
            console.error("Duplicate error:", error);
            toast.error(
                `Failed to duplicate ${copyVariant === "form" ? "form" : "template"}`,
            );
        }
    };

    if (showEditor || editingTemplate) {
        return (
            <TemplateEditor
                clientId={clientId}
                template={editingTemplate}
                copyVariant={copyVariant}
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
                        <h3 className="text-lg font-medium">
                            {copyVariant === "form"
                                ? "Forms"
                                : "Form Templates"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {copyVariant === "form"
                                ? readOnly
                                    ? "View patient intake forms"
                                    : "Create and manage patient intake forms"
                                : readOnly
                                  ? "View patient intake form templates"
                                  : "Create and manage patient intake form templates"}
                        </p>
                    </div>
                    {!readOnly && (
                        <Button onClick={() => setShowEditor(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {copyVariant === "form"
                                ? "New Form"
                                : "New Template"}
                        </Button>
                    )}
                </div>

                {templates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                {copyVariant === "form"
                                    ? "No forms yet"
                                    : "No form templates yet"}
                            </h3>
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {copyVariant === "form"
                                    ? readOnly
                                        ? "No forms have been created yet."
                                        : "Create your first patient intake form to start collecting patient information digitally."
                                    : readOnly
                                      ? "No form templates have been created yet."
                                      : "Create your first patient intake form template to start collecting patient information digitally."}
                            </p>
                            {!readOnly && (
                                <Button onClick={() => setShowEditor(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {copyVariant === "form"
                                        ? "Create Form"
                                        : "Create Template"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {templates.map((template) => (
                            <Card
                                key={template._id}
                                className={
                                    readOnly
                                        ? undefined
                                        : "cursor-pointer transition-colors hover:bg-muted/30"
                                }
                                onClick={
                                    readOnly
                                        ? undefined
                                        : () => openTemplateEditor(template)
                                }
                                onKeyDown={
                                    readOnly
                                        ? undefined
                                        : (event) =>
                                              handleCardKeyDown(event, template)
                                }
                                role={readOnly ? undefined : "button"}
                                tabIndex={readOnly ? undefined : 0}
                            >
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
                                                    statusColors[
                                                        template.status
                                                    ]
                                                }
                                            >
                                                {template.status}
                                            </Badge>
                                            <div className="flex items-center gap-0.5">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                stopCardClick(
                                                                    event,
                                                                );
                                                                setPreviewTemplate(
                                                                    template,
                                                                );
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Preview
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            {!readOnly && (
                                                <div className="flex items-center gap-0.5">
                                                    {template.status ===
                                                        "draft" && (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={(
                                                                        event,
                                                                    ) => {
                                                                        stopCardClick(
                                                                            event,
                                                                        );
                                                                        handleStatusChange(
                                                                            template._id,
                                                                            "active",
                                                                        );
                                                                    }}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Activate
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    stopCardClick(
                                                                        event,
                                                                    );
                                                                    openTemplateEditor(
                                                                        template,
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Edit
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    stopCardClick(
                                                                        event,
                                                                    );
                                                                    handleDuplicate(
                                                                        template,
                                                                    );
                                                                }}
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Duplicate
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {template.status ===
                                                        "active" && (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={(
                                                                        event,
                                                                    ) => {
                                                                        stopCardClick(
                                                                            event,
                                                                        );
                                                                        setDeliveryTemplate(
                                                                            template,
                                                                        );
                                                                        setDeliveryOpen(
                                                                            true,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Send to Patient
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    stopCardClick(
                                                                        event,
                                                                    );
                                                                    setTranslateTarget(
                                                                        template,
                                                                    );
                                                                }}
                                                            >
                                                                <Languages className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Translate or
                                                            retranslate
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    stopCardClick(
                                                                        event,
                                                                    );
                                                                    setDeleteTarget(
                                                                        template,
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Delete
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <span>Version {template.version}</span>
                                        <span>
                                            {
                                                template.sections.filter(
                                                    (s) => s.enabled,
                                                ).length
                                            }{" "}
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
                                            {formatProjectDate(
                                                template.updatedAt,
                                            )}
                                        </span>
                                        {(() => {
                                            const templateMeta =
                                                template as unknown as {
                                                    translations?: Array<{
                                                        language: string;
                                                    }>;
                                                    translatedAt?: number;
                                                    translationStatus?:
                                                        | "pending"
                                                        | "completed"
                                                        | "failed";
                                                    translationError?:
                                                        | string
                                                        | null;
                                                };
                                            const translations =
                                                templateMeta.translations ?? [];
                                            const translatedAt =
                                                templateMeta.translatedAt;
                                            const translationStatus =
                                                templateMeta.translationStatus;
                                            const translationError =
                                                templateMeta.translationError;
                                            const translatedLanguages =
                                                translations.length > 0
                                                    ? translations
                                                          .map(
                                                              (translation) =>
                                                                  LANGUAGE_LABELS[
                                                                      translation
                                                                          .language
                                                                  ] ??
                                                                  translation.language,
                                                          )
                                                          .join(", ")
                                                    : "None yet";

                                            if (
                                                translationStatus === "pending"
                                            ) {
                                                return (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                Translating
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            In progress on
                                                            servers
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            if (
                                                translationStatus ===
                                                    "completed" &&
                                                translations.length > 0
                                            ) {
                                                return (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                                <Languages className="h-3.5 w-3.5" />
                                                                Translated
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="space-y-1">
                                                                <p>
                                                                    Languages:{" "}
                                                                    {
                                                                        translatedLanguages
                                                                    }
                                                                </p>
                                                                <p>
                                                                    Last
                                                                    translated:{" "}
                                                                    {formatProjectDateTime(
                                                                        translatedAt,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            if (
                                                translationStatus === "failed"
                                            ) {
                                                return (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-flex items-center gap-1 text-destructive">
                                                                <CircleAlert className="h-3.5 w-3.5" />
                                                                Translation
                                                                failed
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {translationError ||
                                                                "Translation failed. Try again."}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                                                            <Languages className="h-3.5 w-3.5" />
                                                            Not translated
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        No translations
                                                        generated yet
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })()}
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
                        <AlertDialogTitle>
                            {copyVariant === "form"
                                ? "Delete Form"
                                : "Delete Template"}
                        </AlertDialogTitle>
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

            <AlertDialog
                open={!!translateTarget}
                onOpenChange={(open) => !open && setTranslateTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {(() => {
                                const translations = (
                                    translateTarget as
                                        | (Doc<"formTemplates"> & {
                                              translations?: unknown[];
                                          })
                                        | null
                                )?.translations;
                                return translations && translations.length > 0
                                    ? "Retranslate Template"
                                    : "Translate Template";
                            })()}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {(() => {
                                const translations = (
                                    translateTarget as
                                        | (Doc<"formTemplates"> & {
                                              translations?: unknown[];
                                          })
                                        | null
                                )?.translations;
                                const actionLabel =
                                    translations && translations.length > 0
                                        ? "retranslate"
                                        : "translate";
                                return `Are you sure you want to ${actionLabel} "${translateTarget?.name}"? This will queue a background translation job on servers.`;
                            })()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                translateTarget &&
                                handleRetranslate(translateTarget._id)
                            }
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeliveryDialog
                open={deliveryOpen}
                onOpenChange={setDeliveryOpen}
                clientId={clientId}
                template={deliveryTemplate}
            />

            <Dialog
                open={!!previewTemplate}
                onOpenChange={(open) => !open && setPreviewTemplate(null)}
            >
                <DialogContent className="sm:max-w-3xl p-0 gap-0">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>Form Preview</DialogTitle>
                        <DialogDescription>
                            Preview of &quot;{previewTemplate?.name}&quot; as patients will see it
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] px-6 pb-6 pt-4">
                        {previewTemplate && (
                            <FormRenderer
                                template={previewTemplate}
                                language="en"
                                clientName={clientName ?? "Your Practice"}
                                preview
                            />
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
