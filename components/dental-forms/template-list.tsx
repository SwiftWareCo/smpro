"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type MouseEvent,
} from "react";
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
    MoreVertical,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormRenderer } from "@/components/patient-form/form-renderer";
import { TemplateEditor } from "./template-editor";
import { DeliveryDialog } from "./delivery-dialog";
import { formatProjectDate, formatProjectDateTime } from "@/lib/date-utils";
import { buildTenantThemeStyle } from "@/lib/tenant-theme";

interface TemplateListProps {
    clientId: Id<"clients">;
    templates: Doc<"formTemplates">[];
    readOnly?: boolean;
    copyVariant?: "template" | "form";
    clientName?: string;
    portalPrimaryColor?: string | null;
    portalSecondaryColor?: string | null;
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
const PREVIEW_FADE_DURATION_MS = 180;

export function TemplateList({
    clientId,
    templates,
    readOnly,
    copyVariant = "template",
    clientName,
    portalPrimaryColor,
    portalSecondaryColor,
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
    const [previewMounted, setPreviewMounted] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const previewCloseTimeoutRef = useRef<number | null>(null);
    const displayPreview = previewTemplate;

    const isPortal = !!(portalPrimaryColor || portalSecondaryColor);
    const portalDialogStyle = useMemo(
        () =>
            isPortal
                ? {
                      colorScheme: "light" as const,
                      ...buildTenantThemeStyle({
                          primaryColor: portalPrimaryColor,
                          secondaryColor: portalSecondaryColor,
                      }),
                  }
                : undefined,
        [isPortal, portalPrimaryColor, portalSecondaryColor],
    );

    const updateTemplate = useMutation(api.formTemplates.update);
    const removeTemplate = useMutation(api.formTemplates.remove);
    const retranslateTemplate = useMutation(api.formTemplates.retranslate);
    const createTemplate = useMutation(api.formTemplates.create);

    const clearPreviewCloseTimeout = () => {
        if (!previewCloseTimeoutRef.current) return;
        window.clearTimeout(previewCloseTimeoutRef.current);
        previewCloseTimeoutRef.current = null;
    };

    useEffect(
        () => () => {
            clearPreviewCloseTimeout();
        },
        [],
    );

    const openPreview = (template: Doc<"formTemplates">) => {
        clearPreviewCloseTimeout();
        setPreviewTemplate(template);
        setPreviewMounted(true);
        window.requestAnimationFrame(() => setPreviewVisible(true));
    };

    const closePreview = () => {
        setPreviewVisible(false);
        clearPreviewCloseTimeout();
        previewCloseTimeoutRef.current = window.setTimeout(() => {
            setPreviewMounted(false);
            setPreviewTemplate(null);
        }, PREVIEW_FADE_DURATION_MS);
    };

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

    const compactCards = copyVariant === "form";

    if (showEditor || editingTemplate) {
        return (
            <TemplateEditor
                clientId={clientId}
                template={editingTemplate}
                copyVariant={copyVariant}
                portalPrimaryColor={portalPrimaryColor}
                portalSecondaryColor={portalSecondaryColor}
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
                    <div
                        className={
                            compactCards
                                ? "grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                                : "grid gap-4"
                        }
                    >
                        {templates.map((template) => (
                            <Card
                                key={template._id}
                                className={`${compactCards ? "overflow-hidden" : ""} ${
                                    readOnly
                                        ? ""
                                        : "cursor-pointer transition-colors hover:bg-muted/30"
                                }`}
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
                                <CardHeader
                                    className={
                                        compactCards
                                            ? "px-2.5 pt-2.5 pb-1.5"
                                            : "pb-3"
                                    }
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 space-y-0.5">
                                            <CardTitle
                                                className={
                                                    compactCards
                                                        ? "flex items-center gap-1 text-[13px]"
                                                        : "flex items-center gap-2 text-base"
                                                }
                                            >
                                                <FileText
                                                    className={
                                                        compactCards
                                                            ? "h-3 w-3"
                                                            : "h-4 w-4"
                                                    }
                                                />
                                                <span
                                                    className="min-w-0 truncate"
                                                    title={template.name}
                                                >
                                                    {template.name}
                                                </span>
                                            </CardTitle>
                                            {template.description && (
                                                <CardDescription
                                                    className={
                                                        compactCards
                                                            ? "truncate text-xs"
                                                            : undefined
                                                    }
                                                >
                                                    {template.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <div
                                            className={
                                                compactCards
                                                    ? "flex items-center gap-0.5"
                                                    : "flex items-center gap-2"
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <Badge
                                                variant="secondary"
                                                className={`${statusColors[template.status]} ${
                                                    compactCards
                                                        ? "px-1 py-0 text-[9px]"
                                                        : ""
                                                }`}
                                            >
                                                {template.status}
                                            </Badge>
                                            <div className="flex items-center gap-0.5">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={
                                                                compactCards
                                                                    ? "h-6 w-6"
                                                                    : "h-8 w-8"
                                                            }
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                stopCardClick(
                                                                    event,
                                                                );
                                                                openPreview(
                                                                    template,
                                                                );
                                                            }}
                                                        >
                                                            <Eye
                                                                className={
                                                                    compactCards
                                                                        ? "h-3 w-3"
                                                                        : "h-4 w-4"
                                                                }
                                                            />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Preview
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            {!readOnly && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={
                                                                compactCards
                                                                    ? "h-6 w-6"
                                                                    : "h-8 w-8"
                                                            }
                                                            onClick={
                                                                stopCardClick
                                                            }
                                                        >
                                                            <MoreVertical
                                                                className={
                                                                    compactCards
                                                                        ? "h-3 w-3"
                                                                        : "h-4 w-4"
                                                                }
                                                            />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className={
                                                            isPortal
                                                                ? "force-light"
                                                                : undefined
                                                        }
                                                        style={
                                                            portalDialogStyle
                                                        }
                                                        onCloseAutoFocus={(e) =>
                                                            e.preventDefault()
                                                        }
                                                    >
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
                                                                <CheckCircle className="mr-2 h-4 w-4" />{" "}
                                                                Activate
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                openTemplateEditor(
                                                                    template,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />{" "}
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleDuplicate(
                                                                    template,
                                                                )
                                                            }
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />{" "}
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        {template.status ===
                                                            "active" && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setDeliveryTemplate(
                                                                        template,
                                                                    );
                                                                    setDeliveryOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Send className="mr-2 h-4 w-4" />{" "}
                                                                Send to Patient
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setTranslateTarget(
                                                                    template,
                                                                )
                                                            }
                                                        >
                                                            <Languages className="mr-2 h-4 w-4" />{" "}
                                                            Translate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    template,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent
                                    className={
                                        compactCards
                                            ? "px-2.5 pt-0 pb-2.5"
                                            : undefined
                                    }
                                >
                                    <div
                                        className={
                                            compactCards
                                                ? "flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] text-muted-foreground"
                                                : "flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                                        }
                                    >
                                        <span
                                            className={
                                                compactCards
                                                    ? "rounded-md bg-muted/40 px-1.5 py-0.5"
                                                    : undefined
                                            }
                                        >
                                            Version {template.version}
                                        </span>
                                        <span
                                            className={
                                                compactCards
                                                    ? "rounded-md bg-muted/40 px-1.5 py-0.5"
                                                    : undefined
                                            }
                                        >
                                            {
                                                template.sections.filter(
                                                    (s) => s.enabled,
                                                ).length
                                            }{" "}
                                            sections
                                        </span>
                                        <span
                                            className={
                                                compactCards
                                                    ? "rounded-md bg-muted/40 px-1.5 py-0.5"
                                                    : undefined
                                            }
                                        >
                                            {template.sections
                                                .filter((s) => s.enabled)
                                                .reduce(
                                                    (acc, s) =>
                                                        acc + s.fields.length,
                                                    0,
                                                )}{" "}
                                            fields
                                        </span>
                                        <span
                                            className={
                                                compactCards
                                                    ? "rounded-md bg-muted/40 px-1.5 py-0.5"
                                                    : undefined
                                            }
                                        >
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
                <AlertDialogContent
                    className={isPortal ? "force-light" : undefined}
                    style={portalDialogStyle}
                >
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
                <AlertDialogContent
                    className={isPortal ? "force-light" : undefined}
                    style={portalDialogStyle}
                >
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
                dialogClassName={isPortal ? "force-light" : undefined}
                dialogStyle={portalDialogStyle}
            />

            {previewMounted && displayPreview && (
                <div
                    className={`force-light fixed inset-0 z-50 flex flex-col bg-background transition-opacity duration-200 ease-out ${
                        previewVisible
                            ? "opacity-100"
                            : "pointer-events-none opacity-0"
                    }`}
                    style={portalDialogStyle}
                >
                    <Tabs
                        defaultValue="desktop"
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        {/* Header bar */}
                        <div className="flex items-center justify-between border-b border-border/70 px-6 py-3">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Form Preview
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    &quot;{displayPreview?.name}&quot; as
                                    patients will see it
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <TabsList className="rounded-xl">
                                    <TabsTrigger value="desktop">
                                        Desktop
                                    </TabsTrigger>
                                    <TabsTrigger value="mobile">
                                        Mobile
                                    </TabsTrigger>
                                </TabsList>
                                <Button
                                    variant="outline"
                                    onClick={closePreview}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>

                        {/* Desktop content */}
                        <TabsContent
                            value="desktop"
                            className="flex-1 overflow-y-auto p-6"
                        >
                            <div className="mx-auto max-w-4xl rounded-xl bg-background p-4 sm:p-6">
                                {displayPreview && (
                                    <FormRenderer
                                        template={displayPreview}
                                        language="en"
                                        clientName={
                                            clientName ?? "Your Practice"
                                        }
                                        preview
                                        dialogClassName="force-light"
                                        dialogStyle={portalDialogStyle}
                                    />
                                )}
                            </div>
                        </TabsContent>

                        {/* Mobile content */}
                        <TabsContent
                            value="mobile"
                            className="flex-1 overflow-x-hidden overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <div className="mx-auto w-full max-w-[420px] rounded-[28px] border border-border/70 bg-muted/20 p-3">
                                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-muted-foreground/30" />
                                <div className="max-h-[calc(100dvh-200px)] overflow-x-hidden overflow-y-auto rounded-[20px] border border-border/60 bg-background px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {displayPreview && (
                                        <FormRenderer
                                            template={displayPreview}
                                            language="en"
                                            clientName={
                                                clientName ?? "Your Practice"
                                            }
                                            preview
                                            mobile
                                            dialogClassName="force-light"
                                            dialogStyle={portalDialogStyle}
                                        />
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </>
    );
}
