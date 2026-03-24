"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Eye,
    Copy,
    GripVertical,
    Loader2,
    Plus,
    Trash2,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
    FieldType,
    TemplateField,
    TemplateSection,
} from "@/lib/validation/dental-form";
import {
    DEFAULT_CONSENT_VERSION,
    DEFAULT_PIPA_CONSENT_TEXT,
} from "@/lib/validation/consent";
import { buildTenantThemeStyle } from "@/lib/tenant-theme";
import { FormRenderer } from "@/components/patient-form/form-renderer";
import { FieldEditorDialog } from "@/components/dental-forms/template-editor/field-editor-dialog";
import { TemplateSectionCard } from "@/components/dental-forms/template-editor/template-section-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemplateEditorProps {
    clientId: Id<"clients">;
    template?: Doc<"formTemplates"> | null;
    copyVariant?: "template" | "form";
    onClose: () => void;
    portalPrimaryColor?: string | null;
    portalSecondaryColor?: string | null;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Textbox" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Single Choice" },
    { value: "multiSelect", label: "Multiple Choice" },
    { value: "signature", label: "Signature" },
    { value: "address", label: "Address" },
    { value: "paragraph", label: "Paragraph" },
];

const FIELD_TYPE_LABELS: Record<FieldType, string> = FIELD_TYPES.reduce(
    (labels, fieldType) => {
        labels[fieldType.value] = fieldType.label;
        return labels;
    },
    {} as Record<FieldType, string>,
);

const NEW_TEMPLATE_NAME = "";
const NEW_TEMPLATE_DESCRIPTION = "";

const FORMAT_PRESETS: { label: string; pattern: string; message: string }[] = [
    {
        label: "Numbers only",
        pattern: "^\\d+$",
        message: "Only numbers are allowed",
    },
    {
        label: "Letters only",
        pattern: "^[a-zA-Z\\s]+$",
        message: "Only letters are allowed",
    },
    {
        label: "No special characters",
        pattern: "^[a-zA-Z0-9\\s]+$",
        message: "Special characters are not allowed",
    },
    {
        label: "Phone number",
        pattern: "^\\+?[\\d\\s\\-()]{7,15}$",
        message: "Enter a valid phone number",
    },
    {
        label: "Postal code (Canada)",
        pattern: "^[A-Za-z]\\d[A-Za-z]\\s?\\d[A-Za-z]\\d$",
        message: "Enter a valid Canadian postal code (e.g. V6B 1A1)",
    },
    {
        label: "Zip code (US)",
        pattern: "^\\d{5}(-\\d{4})?$",
        message: "Enter a valid US zip code (e.g. 90210)",
    },
];

const OPTION_PRESETS = [
    { label: "Yes / No", options: ["Yes", "No"] },
    { label: "Male / Female", options: ["Male", "Female"] },
    { label: "Daily / Weekly / Never", options: ["Daily", "Weekly", "Never"] },
] as const;

const SECTION_ACTION_BUTTON_CLASS =
    "border-2 border-blue-500 bg-white text-slate-950 shadow-sm hover:border-blue-600 hover:bg-blue-50 hover:text-slate-950 dark:border-blue-400 dark:bg-white dark:text-slate-950 dark:hover:border-blue-300 dark:hover:bg-blue-50";

function generateId(): string {
    return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultOptions(fieldType: FieldType): string[] | undefined {
    if (fieldType === "radio") {
        return ["Option 1", "Option 2"];
    }

    if (fieldType === "select") {
        return ["Choice 1", "Choice 2"];
    }

    if (fieldType === "multiSelect") {
        return ["Option 1", "Option 2", "Option 3"];
    }

    return undefined;
}

function getDefaultFieldLabel(fieldType: FieldType): string {
    if (fieldType === "radio") {
        return "New single choice";
    }

    if (fieldType === "select") {
        return "New dropdown";
    }

    if (fieldType === "multiSelect") {
        return "New multiple choice";
    }

    return "New field";
}

function createField(fieldType: FieldType = "text"): TemplateField {
    return {
        id: generateId(),
        type: fieldType,
        label: "",
        required: false,
        placeholder: supportsPlaceholder(fieldType) ? "" : undefined,
        options: getDefaultOptions(fieldType),
        width: fieldType === "address" ? "full" : undefined,
        paragraphStyle:
            fieldType === "paragraph"
                ? {
                      fontSize: "base",
                      bold: false,
                  }
                : undefined,
    };
}

function supportsPlaceholder(fieldType: FieldType): boolean {
    return ![
        "date",
        "select",
        "radio",
        "multiSelect",
        "signature",
        "address",
        "paragraph",
    ].includes(fieldType);
}

function supportsOptions(fieldType: FieldType): boolean {
    return (
        fieldType === "select" ||
        fieldType === "radio" ||
        fieldType === "multiSelect"
    );
}

function supportsValidation(fieldType: FieldType): boolean {
    return ["text", "textarea", "email", "phone", "number"].includes(fieldType);
}

function supportsPattern(fieldType: FieldType): boolean {
    return ["text", "textarea", "email", "phone"].includes(fieldType);
}

function supportsFollowUp(fieldType: FieldType): boolean {
    return fieldType !== "paragraph";
}

function supportsRequired(fieldType: FieldType): boolean {
    return fieldType !== "paragraph";
}

// --- Field Editor Dialog ---

// --- Main Editor ---

export function TemplateEditor({
    clientId,
    template,
    copyVariant = "template",
    onClose,
    portalPrimaryColor,
    portalSecondaryColor,
}: TemplateEditorProps) {
    const isEditing = !!template;
    const isPortal = !!(portalPrimaryColor || portalSecondaryColor);
    const portalStyle = useMemo(
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
    const [name, setName] = useState(template?.name ?? NEW_TEMPLATE_NAME);
    const [description, setDescription] = useState(
        template?.description ?? NEW_TEMPLATE_DESCRIPTION,
    );
    const [sections, setSections] = useState<TemplateSection[]>(
        template?.sections ?? [],
    );
    const [saving, setSaving] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(
        template?.sections?.[0]?.id ?? "",
    );
    const [editingField, setEditingField] = useState<{
        sectionId: string;
        fieldId: string;
    } | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const createTemplate = useMutation(api.formTemplates.create);
    const updateTemplate = useMutation(api.formTemplates.update);

    const updateSection = useCallback(
        (
            sectionId: string,
            updates: Partial<Omit<TemplateSection, "fields">>,
        ) => {
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? { ...section, ...updates }
                        : section,
                ),
            );
        },
        [],
    );

    const focusSection = useCallback((sectionId: string) => {
        setActiveSectionId(sectionId);
        sectionRefs.current[sectionId]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        window.setTimeout(() => {
            const sectionTitleInput = document.getElementById(
                `section-title-${sectionId}`,
            );
            if (sectionTitleInput instanceof HTMLElement) {
                sectionTitleInput.focus({ preventScroll: true });
            }
        }, 180);
    }, []);

    const addSection = useCallback(() => {
        const newSection: TemplateSection = {
            id: generateId(),
            title: "New Section",
            description: "",
            enabled: true,
            fields: [],
        };
        setSections((prev) => [...prev, newSection]);
        setActiveSectionId(newSection.id);
        toast.success("Section added");
        window.setTimeout(() => focusSection(newSection.id), 50);
    }, [focusSection]);

    const removeSection = useCallback((sectionId: string) => {
        setSections((prev) => {
            const nextSections = prev.filter(
                (section) => section.id !== sectionId,
            );
            setActiveSectionId((current) =>
                current === sectionId ? (nextSections[0]?.id ?? "") : current,
            );
            return nextSections;
        });
        toast.success("Section removed");
    }, []);

    const addField = useCallback(
        (sectionId: string, fieldType: FieldType = "text") => {
            const newField = createField(fieldType);
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? { ...section, fields: [...section.fields, newField] }
                        : section,
                ),
            );
            setEditingField({ sectionId, fieldId: newField.id });
            toast.success("Field added");
        },
        [],
    );

    const setFieldType = useCallback(
        (sectionId: string, fieldId: string, nextType: FieldType) => {
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? {
                              ...section,
                              fields: section.fields.map((field) =>
                                  field.id === fieldId
                                      ? {
                                            ...field,
                                            type: nextType,
                                            options:
                                                getDefaultOptions(nextType),
                                            placeholder: supportsPlaceholder(
                                                nextType,
                                            )
                                                ? (field.placeholder ?? "")
                                                : undefined,
                                            required: supportsRequired(nextType)
                                                ? field.required
                                                : false,
                                            label:
                                                field.label === "" ||
                                                field.label === "New field" ||
                                                field.label ===
                                                    "New dropdown" ||
                                                field.label ===
                                                    "New radio group"
                                                    ? ""
                                                    : field.label,
                                            validation: supportsValidation(
                                                nextType,
                                            )
                                                ? field.validation
                                                : undefined,
                                            followUps: supportsFollowUp(
                                                nextType,
                                            )
                                                ? field.followUps
                                                : undefined,
                                            width:
                                                nextType === "address"
                                                    ? "full"
                                                    : field.width,
                                            paragraphStyle:
                                                nextType === "paragraph"
                                                    ? (field.paragraphStyle ?? {
                                                          fontSize: "base",
                                                          bold: false,
                                                      })
                                                    : undefined,
                                        }
                                      : field,
                              ),
                          }
                        : section,
                ),
            );
        },
        [],
    );

    const updateField = useCallback(
        (
            sectionId: string,
            fieldId: string,
            updates: Partial<TemplateField>,
        ) => {
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? {
                              ...section,
                              fields: section.fields.map((field) => {
                                  if (field.id !== fieldId) return field;
                                  const nextField = { ...field, ...updates };
                                  if (nextField.type === "address") {
                                      nextField.width = "full";
                                  }
                                  return nextField;
                              }),
                          }
                        : section,
                ),
            );
        },
        [],
    );

    const removeField = useCallback((sectionId: string, fieldId: string) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? {
                          ...section,
                          fields: section.fields.filter(
                              (field) => field.id !== fieldId,
                          ),
                      }
                    : section,
            ),
        );
        toast.success("Field removed");
    }, []);

    const duplicateField = useCallback((sectionId: string, fieldId: string) => {
        let cloneId = "";
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const fieldIndex = section.fields.findIndex(
                    (f) => f.id === fieldId,
                );
                if (fieldIndex === -1) return section;
                const original = section.fields[fieldIndex];
                cloneId = generateId();
                const clone: TemplateField = {
                    ...structuredClone(original),
                    id: cloneId,
                    label: original.label ? `${original.label} (copy)` : "",
                };
                const nextFields = [...section.fields];
                nextFields.splice(fieldIndex + 1, 0, clone);
                return { ...section, fields: nextFields };
            }),
        );
        // Open editor for the clone after state settles
        if (cloneId) {
            setEditingField({ sectionId, fieldId: cloneId });
        }
        toast.success("Field duplicated");
    }, []);

    const reorderFields = useCallback(
        (sectionId: string, oldIndex: number, newIndex: number) => {
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? {
                              ...section,
                              fields: arrayMove(
                                  section.fields,
                                  oldIndex,
                                  newIndex,
                              ),
                          }
                        : section,
                ),
            );
        },
        [],
    );

    const addFieldOption = useCallback((sectionId: string, fieldId: string) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? {
                          ...section,
                          fields: section.fields.map((field) =>
                              field.id === fieldId
                                  ? {
                                        ...field,
                                        options: [
                                            ...(field.options ?? []),
                                            `Option ${(field.options ?? []).length + 1}`,
                                        ],
                                    }
                                  : field,
                          ),
                      }
                    : section,
            ),
        );
    }, []);

    const removeFieldOption = useCallback(
        (sectionId: string, fieldId: string, optionIndex: number) => {
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? {
                              ...section,
                              fields: section.fields.map((field) =>
                                  field.id === fieldId
                                      ? {
                                            ...field,
                                            options: (
                                                field.options ?? []
                                            ).filter(
                                                (_, index) =>
                                                    index !== optionIndex,
                                            ),
                                        }
                                      : field,
                              ),
                          }
                        : section,
                ),
            );
        },
        [],
    );

    const applyOptionPreset = useCallback(
        (sectionId: string, fieldId: string, options: readonly string[]) => {
            updateField(sectionId, fieldId, {
                options: [...options],
            });
        },
        [updateField],
    );

    const { missingSectionTitleIds, missingFieldLabelIds } = useMemo(() => {
        const sectionIds = new Set<string>();
        const fieldIds = new Set<string>();

        for (const section of sections) {
            if (!section.title.trim()) {
                sectionIds.add(section.id);
            }
            for (const field of section.fields) {
                if (!field.label.trim()) {
                    fieldIds.add(field.id);
                }
            }
        }

        return {
            missingSectionTitleIds: sectionIds,
            missingFieldLabelIds: fieldIds,
        };
    }, [sections]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error(
                `${copyVariant === "form" ? "Form" : "Template"} name is required`,
            );
            return;
        }

        const enabledSections = sections.filter((section) => section.enabled);
        if (enabledSections.length === 0) {
            toast.error("At least one section must be enabled");
            return;
        }

        const hasMissingLabels =
            missingSectionTitleIds.size > 0 || missingFieldLabelIds.size > 0;
        if (hasMissingLabels) {
            setShowValidationErrors(true);
            toast.error(
                "Missing labels are highlighted in red. Add section and field labels before saving.",
            );
            return;
        }

        setShowValidationErrors(false);
        setSaving(true);
        try {
            if (isEditing && template) {
                await updateTemplate({
                    templateId: template._id,
                    name,
                    description,
                    sections,
                    consentText: DEFAULT_PIPA_CONSENT_TEXT,
                    consentVersion: DEFAULT_CONSENT_VERSION,
                });
                toast.success(
                    `${copyVariant === "form" ? "Form" : "Template"} updated`,
                );
            } else {
                await createTemplate({
                    clientId,
                    name,
                    description,
                    sections,
                    consentText: DEFAULT_PIPA_CONSENT_TEXT,
                    consentVersion: DEFAULT_CONSENT_VERSION,
                });
                toast.success(
                    `${copyVariant === "form" ? "Form" : "Template"} created`,
                );
            }
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            toast.error(
                `Failed to save ${copyVariant === "form" ? "form" : "template"}`,
            );
        } finally {
            setSaving(false);
        }
    };

    const enabledSectionCount = useMemo(
        () => sections.filter((section) => section.enabled).length,
        [sections],
    );
    const fieldCount = useMemo(
        () =>
            sections.reduce(
                (count, section) => count + section.fields.length,
                0,
            ),
        [sections],
    );
    const visibleSections = useMemo(
        () => sections.filter((section) => section.enabled),
        [sections],
    );
    const previewTemplate = useMemo(
        () => ({
            name: name.trim() || "Untitled form",
            description,
            sections,
            consentText: template?.consentText ?? DEFAULT_PIPA_CONSENT_TEXT,
            consentVersion: template?.consentVersion ?? DEFAULT_CONSENT_VERSION,
        }),
        [
            description,
            name,
            sections,
            template?.consentText,
            template?.consentVersion,
        ],
    );

    const setSectionRef = useCallback(
        (sectionId: string, node: HTMLDivElement | null) => {
            sectionRefs.current[sectionId] = node;
        },
        [],
    );

    const setActiveSection = useCallback((sectionId: string) => {
        setActiveSectionId(sectionId);
    }, []);

    const openFieldEditor = useCallback(
        (sectionId: string, fieldId: string) => {
            setEditingField({ sectionId, fieldId });
        },
        [],
    );

    const closeFieldEditor = useCallback(() => {
        setEditingField(null);
    }, []);

    // Resolve the currently-editing field from sections state.
    // Keep a ref snapshot so dialog content stays painted during exit animation.
    const editingFieldData = useMemo(() => {
        if (!editingField) return null;
        const section = sections.find((s) => s.id === editingField.sectionId);
        return (
            section?.fields.find((f) => f.id === editingField.fieldId) ?? null
        );
    }, [editingField, sections]);

    const lastFieldSnapshot = useRef<{
        field: TemplateField;
        sectionId: string;
    } | null>(null);
    if (editingFieldData && editingField) {
        lastFieldSnapshot.current = {
            field: editingFieldData,
            sectionId: editingField.sectionId,
        };
    }

    const dialogOpen = !!editingField;
    const displayField =
        editingFieldData ?? lastFieldSnapshot.current?.field ?? null;
    const displaySectionId =
        editingField?.sectionId ?? lastFieldSnapshot.current?.sectionId ?? "";

    return (
        <div
            className={`w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-200 space-y-6 pb-24${isPortal ? " force-light" : ""}`}
            style={portalStyle}
        >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="rounded-full px-3 py-1"
                            >
                                {isEditing
                                    ? copyVariant === "form"
                                        ? "Editing form"
                                        : "Editing template"
                                    : copyVariant === "form"
                                      ? "New form"
                                      : "New template"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Build the intake flow inline.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            Sections
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                            {enabledSectionCount}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            Items
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                            {fieldCount}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader>
                    <div className="flex w-full items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                            <CardTitle>Form Flow</CardTitle>
                            <CardDescription>
                                Sections and fields.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            className={`shrink-0 ${SECTION_ACTION_BUTTON_CLASS}`}
                            onClick={addSection}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Section
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">
                                {copyVariant === "form"
                                    ? "Form name"
                                    : "Template name"}
                            </Label>
                            <Input
                                id="template-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="New patient intake form"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template-description">
                                Description
                            </Label>
                            <Textarea
                                id="template-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Used before a first appointment or annual update"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
                        <div className="hidden xl:block xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100svh-8rem)] xl:overflow-y-auto">
                            <div className="rounded-3xl border border-border/70 bg-muted/15 p-4 shadow-sm">
                                <div className="space-y-1.5">
                                    <p className="text-sm font-semibold">
                                        Flow map
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Jump to a section.
                                    </p>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {sections.map((section, sectionIndex) => (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() =>
                                                focusSection(section.id)
                                            }
                                            className={`block w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                                                activeSectionId === section.id
                                                    ? "border-primary/35 bg-primary/10 shadow-sm"
                                                    : section.enabled
                                                      ? "border-primary/20 bg-primary/5 hover:bg-primary/8"
                                                      : "border-border/70 bg-background/70 hover:bg-muted/20"
                                            }`}
                                            aria-pressed={
                                                activeSectionId === section.id
                                            }
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-xs font-semibold">
                                                    {sectionIndex + 1}
                                                </div>
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium">
                                                            {section.title ||
                                                                "Untitled section"}
                                                        </p>
                                                        <span
                                                            className={`inline-flex h-2 w-2 rounded-full ${
                                                                section.enabled
                                                                    ? "bg-primary"
                                                                    : "bg-muted-foreground/40"
                                                            }`}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {section.fields.length}{" "}
                                                        items
                                                        {section.enabled
                                                            ? " visible"
                                                            : " hidden"}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/80 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                        Live flow
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {visibleSections.length}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Sections patients currently see.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {sections.length === 0 && (
                                <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
                                    Add a section to start building the form.
                                </div>
                            )}
                            {sections.map((section, sectionIndex) => (
                                <TemplateSectionCard
                                    key={section.id}
                                    section={section}
                                    sectionIndex={sectionIndex}
                                    active={activeSectionId === section.id}
                                    sectionTitleMissing={
                                        showValidationErrors &&
                                        missingSectionTitleIds.has(section.id)
                                    }
                                    missingFieldLabelIds={
                                        showValidationErrors
                                            ? missingFieldLabelIds
                                            : undefined
                                    }
                                    setSectionRef={setSectionRef}
                                    onSetActiveSection={setActiveSection}
                                    onUpdateSection={updateSection}
                                    onRemoveSection={removeSection}
                                    onDuplicateField={duplicateField}
                                    onRemoveField={removeField}
                                    onEditField={openFieldEditor}
                                    onAddField={addField}
                                    onReorderFields={reorderFields}
                                    onUpdateField={updateField}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom bar with actions */}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-1 items-center gap-1.5 overflow-x-auto xl:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {sections.map((section, idx) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => focusSection(section.id)}
                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                    activeSectionId === section.id
                                        ? "bg-primary/15 text-primary"
                                        : section.enabled
                                          ? "bg-muted text-foreground hover:bg-muted/80"
                                          : "bg-muted/50 text-muted-foreground"
                                }`}
                            >
                                {section.title || `Section ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 ml-auto">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <Eye className="mr-1.5 h-4 w-4" />
                            Preview
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addSection}
                            className={SECTION_ACTION_BUTTON_CLASS}
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Section
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : isEditing ? (
                                "Save Changes"
                            ) : copyVariant === "form" ? (
                                "Create Form"
                            ) : (
                                "Create Template"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Field editor dialog — always mounted so close animation runs */}
            <FieldEditorDialog
                field={displayField}
                open={dialogOpen}
                sectionId={displaySectionId}
                dialogClassName={isPortal ? "force-light" : undefined}
                dialogStyle={portalStyle}
                onClose={closeFieldEditor}
                onSetFieldType={setFieldType}
                onUpdateField={updateField}
                onRemoveFieldOption={removeFieldOption}
                onAddFieldOption={addFieldOption}
                onApplyOptionPreset={applyOptionPreset}
            />

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent
                    className="force-light sm:max-w-6xl p-0 gap-0 duration-300"
                    style={portalStyle}
                >
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>Form Preview</DialogTitle>
                        <DialogDescription>
                            Preview of &quot;{previewTemplate.name}&quot; as
                            patients will see it
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] px-6 pb-6 pt-4">
                        <FormRenderer
                            template={previewTemplate as Doc<"formTemplates">}
                            language="en"
                            clientName="Your Practice"
                            preview
                            dialogClassName="force-light"
                            dialogStyle={portalStyle}
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
