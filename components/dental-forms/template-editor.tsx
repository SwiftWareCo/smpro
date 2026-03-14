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
import { ArrowLeft, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import type {
    FieldType,
    TemplateField,
    TemplateSection,
} from "@/lib/validation/dental-form";
import {
    DEFAULT_CONSENT_VERSION,
    DEFAULT_PIPA_CONSENT_TEXT,
} from "@/lib/validation/consent";

interface TemplateEditorProps {
    clientId: Id<"clients">;
    template?: Doc<"formTemplates"> | null;
    onClose: () => void;
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
    { value: "checkbox", label: "Checkbox" },
    { value: "signature", label: "Signature" },
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

const OPTION_PRESETS = [
    { label: "Yes / No", options: ["Yes", "No"] },
    { label: "Male / Female", options: ["Male", "Female"] },
    { label: "Daily / Weekly / Never", options: ["Daily", "Weekly", "Never"] },
] as const;

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

    return undefined;
}

function getDefaultFieldLabel(fieldType: FieldType): string {
    if (fieldType === "radio") {
        return "New radio group";
    }

    if (fieldType === "select") {
        return "New dropdown";
    }

    return "New field";
}

function createField(fieldType: FieldType = "text"): TemplateField {
    return {
        id: generateId(),
        type: fieldType,
        label: getDefaultFieldLabel(fieldType),
        required: false,
        placeholder: supportsPlaceholder(fieldType) ? "" : undefined,
        options: getDefaultOptions(fieldType),
    };
}

function supportsPlaceholder(fieldType: FieldType): boolean {
    return !["date", "select", "radio", "signature"].includes(fieldType);
}

function supportsOptions(fieldType: FieldType): boolean {
    return fieldType === "select" || fieldType === "radio";
}

function supportsRequired(fieldType: FieldType): boolean {
    return true;
}

interface TemplateFieldCardProps {
    sectionId: string;
    field: TemplateField;
    fieldIndex: number;
    onRemoveField: (sectionId: string, fieldId: string) => void;
    onSetFieldType: (
        sectionId: string,
        fieldId: string,
        nextType: FieldType,
    ) => void;
    onUpdateField: (
        sectionId: string,
        fieldId: string,
        updates: Partial<TemplateField>,
    ) => void;
    onUpdateFieldOption: (
        sectionId: string,
        fieldId: string,
        optionIndex: number,
        value: string,
    ) => void;
    onRemoveFieldOption: (
        sectionId: string,
        fieldId: string,
        optionIndex: number,
    ) => void;
    onAddFieldOption: (sectionId: string, fieldId: string) => void;
    onApplyOptionPreset: (
        sectionId: string,
        fieldId: string,
        options: readonly string[],
    ) => void;
}

const TemplateFieldCard = memo(function TemplateFieldCard({
    sectionId,
    field,
    fieldIndex,
    onRemoveField,
    onSetFieldType,
    onUpdateField,
    onUpdateFieldOption,
    onRemoveFieldOption,
    onAddFieldOption,
    onApplyOptionPreset,
}: TemplateFieldCardProps) {
    const [showPlaceholder, setShowPlaceholder] = useState(
        () => !!field.placeholder,
    );

    return (
        <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background text-xs font-semibold">
                        {fieldIndex + 1}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            {supportsRequired(field.type)
                                ? "Question"
                                : "Content block"}
                        </p>
                        <Badge
                            variant="outline"
                            className="rounded-full px-2.5 py-0.5"
                        >
                            {FIELD_TYPE_LABELS[field.type]}
                        </Badge>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveField(sectionId, field.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`field-label-${field.id}`}>
                        Label or content
                    </Label>
                    <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(event) =>
                            onUpdateField(sectionId, field.id, {
                                label: event.target.value,
                            })
                        }
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                    <div className="space-y-2">
                        <Label>Field type</Label>
                        <Select
                            value={field.type}
                            onValueChange={(value) =>
                                onSetFieldType(
                                    sectionId,
                                    field.id,
                                    value as FieldType,
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELD_TYPES.map((fieldType) => (
                                    <SelectItem
                                        key={fieldType.value}
                                        value={fieldType.value}
                                    >
                                        {fieldType.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Required</Label>
                        <div className="flex h-10 items-center rounded-xl border border-border/70 bg-background px-3">
                            <Switch
                                checked={field.required}
                                disabled={!supportsRequired(field.type)}
                                onCheckedChange={(checked) =>
                                    onUpdateField(sectionId, field.id, {
                                        required: checked,
                                    })
                                }
                            />
                            <span className="ml-3 text-sm text-muted-foreground">
                                {supportsRequired(field.type)
                                    ? field.required
                                        ? "Required"
                                        : "Optional"
                                    : "Display only"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {supportsPlaceholder(field.type) &&
                        (field.type === "checkbox" ? (
                            <div className="space-y-2">
                                <Label
                                    htmlFor={`field-placeholder-${field.id}`}
                                >
                                    Checkbox label
                                </Label>
                                <Input
                                    id={`field-placeholder-${field.id}`}
                                    value={field.placeholder ?? ""}
                                    onChange={(event) =>
                                        onUpdateField(sectionId, field.id, {
                                            placeholder: event.target.value,
                                        })
                                    }
                                    placeholder="Yes"
                                />
                            </div>
                        ) : showPlaceholder ? (
                            <div className="space-y-2">
                                <Label
                                    htmlFor={`field-placeholder-${field.id}`}
                                >
                                    Placeholder
                                </Label>
                                <Input
                                    id={`field-placeholder-${field.id}`}
                                    value={field.placeholder ?? ""}
                                    onChange={(event) =>
                                        onUpdateField(sectionId, field.id, {
                                            placeholder: event.target.value,
                                        })
                                    }
                                    placeholder="Optional helper text"
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="self-end text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                                onClick={() => setShowPlaceholder(true)}
                            >
                                + Add placeholder
                            </button>
                        ))}

                    {supportsOptions(field.type) && (
                        <div className="space-y-3 lg:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Label>Choices</Label>
                                <div className="flex flex-wrap gap-2">
                                    {OPTION_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-full px-3 text-xs"
                                            onClick={() =>
                                                onApplyOptionPreset(
                                                    sectionId,
                                                    field.id,
                                                    preset.options,
                                                )
                                            }
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {(field.options ?? []).map(
                                    (option, optionIndex) => (
                                        <div
                                            key={`${field.id}-option-${optionIndex}`}
                                            className="flex items-center gap-2"
                                        >
                                            <Input
                                                value={option}
                                                onChange={(event) =>
                                                    onUpdateFieldOption(
                                                        sectionId,
                                                        field.id,
                                                        optionIndex,
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={`Option ${optionIndex + 1}`}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    onRemoveFieldOption(
                                                        sectionId,
                                                        field.id,
                                                        optionIndex,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ),
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    onAddFieldOption(sectionId, field.id)
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add option
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

interface TemplateSectionCardProps {
    section: TemplateSection;
    sectionIndex: number;
    active: boolean;
    setSectionRef: (sectionId: string, node: HTMLDivElement | null) => void;
    onSetActiveSection: (sectionId: string) => void;
    onUpdateSection: (
        sectionId: string,
        updates: Partial<Omit<TemplateSection, "fields">>,
    ) => void;
    onRemoveSection: (sectionId: string) => void;
    onRemoveField: (sectionId: string, fieldId: string) => void;
    onSetFieldType: (
        sectionId: string,
        fieldId: string,
        nextType: FieldType,
    ) => void;
    onUpdateField: (
        sectionId: string,
        fieldId: string,
        updates: Partial<TemplateField>,
    ) => void;
    onUpdateFieldOption: (
        sectionId: string,
        fieldId: string,
        optionIndex: number,
        value: string,
    ) => void;
    onRemoveFieldOption: (
        sectionId: string,
        fieldId: string,
        optionIndex: number,
    ) => void;
    onAddFieldOption: (sectionId: string, fieldId: string) => void;
    onApplyOptionPreset: (
        sectionId: string,
        fieldId: string,
        options: readonly string[],
    ) => void;
    onAddField: (sectionId: string, fieldType?: FieldType) => void;
}

const TemplateSectionCard = memo(function TemplateSectionCard({
    section,
    sectionIndex,
    active,
    setSectionRef,
    onSetActiveSection,
    onUpdateSection,
    onRemoveSection,
    onRemoveField,
    onSetFieldType,
    onUpdateField,
    onUpdateFieldOption,
    onRemoveFieldOption,
    onAddFieldOption,
    onApplyOptionPreset,
    onAddField,
}: TemplateSectionCardProps) {
    return (
        <div
            ref={(node) => {
                setSectionRef(section.id, node);
            }}
            onFocusCapture={() => onSetActiveSection(section.id)}
            className={`scroll-mt-24 rounded-[28px] border bg-background p-5 shadow-sm transition-colors ${
                active
                    ? "border-primary/30 ring-1 ring-primary/15"
                    : "border-border/70"
            }`}
        >
            <div className="grid gap-5 2xl:grid-cols-[120px_minmax(0,1fr)_auto] 2xl:items-start">
                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        Step
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                        {sectionIndex + 1}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {section.fields.length} items in this section
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant={section.enabled ? "default" : "secondary"}
                            className="rounded-full px-3 py-1"
                        >
                            {section.enabled ? "Visible to patients" : "Hidden"}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="rounded-full px-3 py-1"
                        >
                            {section.fields.length} items
                        </Badge>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`section-title-${section.id}`}>
                                Section title
                            </Label>
                            <Input
                                id={`section-title-${section.id}`}
                                value={section.title}
                                onChange={(event) =>
                                    onUpdateSection(section.id, {
                                        title: event.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor={`section-description-${section.id}`}
                            >
                                Section intro
                            </Label>
                            <Textarea
                                id={`section-description-${section.id}`}
                                value={section.description ?? ""}
                                onChange={(event) =>
                                    onUpdateSection(section.id, {
                                        description: event.target.value,
                                    })
                                }
                                placeholder="Optional context shown before these questions"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/15 px-3 py-2 text-sm">
                        <Switch
                            checked={section.enabled}
                            onCheckedChange={(checked) =>
                                onUpdateSection(section.id, {
                                    enabled: checked,
                                })
                            }
                        />
                        <span>{section.enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveSection(section.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator className="my-5" />

            <div className="space-y-4">
                {section.fields.length > 0 ? (
                    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                        {section.fields.map((field, fieldIndex) => (
                            <TemplateFieldCard
                                key={field.id}
                                sectionId={section.id}
                                field={field}
                                fieldIndex={fieldIndex}
                                onRemoveField={onRemoveField}
                                onSetFieldType={onSetFieldType}
                                onUpdateField={onUpdateField}
                                onUpdateFieldOption={onUpdateFieldOption}
                                onRemoveFieldOption={onRemoveFieldOption}
                                onAddFieldOption={onAddFieldOption}
                                onApplyOptionPreset={onApplyOptionPreset}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                        This section is empty. Add the first item to define what
                        patients should complete here.
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "text")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Text Field
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "textarea")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Textbox
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "select")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Dropdown
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "radio")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Radio Group
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "signature")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Signature
                    </Button>
                </div>
            </div>
        </div>
    );
});

export function TemplateEditor({
    clientId,
    template,
    onClose,
}: TemplateEditorProps) {
    const isEditing = !!template;
    const [name, setName] = useState(template?.name ?? NEW_TEMPLATE_NAME);
    const [description, setDescription] = useState(
        template?.description ?? NEW_TEMPLATE_DESCRIPTION,
    );
    const [sections, setSections] = useState<TemplateSection[]>(
        template?.sections ?? [],
    );
    const [consentText, setConsentText] = useState(
        template?.consentText ?? DEFAULT_PIPA_CONSENT_TEXT,
    );
    const [consentVersion, setConsentVersion] = useState(
        template?.consentVersion ?? DEFAULT_CONSENT_VERSION,
    );
    const [saving, setSaving] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(
        template?.sections?.[0]?.id ?? "",
    );
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
    }, []);

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
                                                field.label === "New field" ||
                                                field.label ===
                                                    "New dropdown" ||
                                                field.label ===
                                                    "New radio group"
                                                    ? getDefaultFieldLabel(
                                                          nextType,
                                                      )
                                                    : field.label,
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
                              fields: section.fields.map((field) =>
                                  field.id === fieldId
                                      ? { ...field, ...updates }
                                      : field,
                              ),
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
    }, []);

    const updateFieldOption = useCallback(
        (
            sectionId: string,
            fieldId: string,
            optionIndex: number,
            value: string,
        ) => {
            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? {
                              ...section,
                              fields: section.fields.map((field) =>
                                  field.id === fieldId
                                      ? {
                                            ...field,
                                            options: (field.options ?? []).map(
                                                (option, index) =>
                                                    index === optionIndex
                                                        ? value
                                                        : option,
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

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Template name is required");
            return;
        }

        if (!consentText.trim()) {
            toast.error("Consent text is required for PIPA compliance");
            return;
        }

        const enabledSections = sections.filter((section) => section.enabled);
        if (enabledSections.length === 0) {
            toast.error("At least one section must be enabled");
            return;
        }

        if (
            sections.some(
                (section) =>
                    !section.title.trim() ||
                    section.fields.some((field) => !field.label.trim()),
            )
        ) {
            toast.error("Each section and field needs a label before saving");
            return;
        }

        setSaving(true);
        try {
            if (isEditing && template) {
                await updateTemplate({
                    templateId: template._id,
                    name,
                    description,
                    sections,
                    consentText,
                    consentVersion,
                });
                toast.success("Template updated");
            } else {
                await createTemplate({
                    clientId,
                    name,
                    description,
                    sections,
                    consentText,
                    consentVersion,
                });
                toast.success("Template created");
            }
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save template");
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

    const setSectionRef = useCallback(
        (sectionId: string, node: HTMLDivElement | null) => {
            sectionRefs.current[sectionId] = node;
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

    const setActiveSection = useCallback((sectionId: string) => {
        setActiveSectionId(sectionId);
    }, []);

    return (
        <div className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-200 space-y-6 pb-24">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="rounded-full px-3 py-1"
                            >
                                {isEditing
                                    ? "Editing template"
                                    : "New template"}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="rounded-full px-3 py-1"
                            >
                                Patient order
                            </Badge>
                        </div>
                        <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                            Keep sections in the same top-to-bottom order
                            patients will complete them. Use the flow map to
                            jump between steps and check that nothing important
                            gets buried.
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
                    <CardTitle>Template Details</CardTitle>
                    <CardDescription>
                        New templates now start blank. Name the form, then add
                        only the sections and questions you need.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Template name</Label>
                        <Input
                            id="template-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
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
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader>
                    <div className="flex w-full items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                            <CardTitle>Form Flow</CardTitle>
                            <CardDescription>
                                Review the intake in chronological order and
                                adjust each step inline.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            className="shrink-0"
                            onClick={addSection}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Section
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-3xl border border-border/70 bg-muted/15 p-4 shadow-sm">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">
                                    Patient flow map
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    This is the order patients experience. Keep
                                    early sections short and save dense details
                                    for later.
                                </p>
                            </div>

                            <div className="mt-4 space-y-2">
                                {sections.map((section, sectionIndex) => (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => focusSection(section.id)}
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
                                                        ? " live in patient flow"
                                                        : " hidden from patients"}
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
                                This template starts empty. Add a section to
                                begin building the form instead of loading the
                                old default intake packet.
                            </div>
                        )}
                        {sections.map((section, sectionIndex) => (
                            <TemplateSectionCard
                                key={section.id}
                                section={section}
                                sectionIndex={sectionIndex}
                                active={activeSectionId === section.id}
                                setSectionRef={setSectionRef}
                                onSetActiveSection={setActiveSection}
                                onUpdateSection={updateSection}
                                onRemoveSection={removeSection}
                                onRemoveField={removeField}
                                onSetFieldType={setFieldType}
                                onUpdateField={updateField}
                                onUpdateFieldOption={updateFieldOption}
                                onRemoveFieldOption={removeFieldOption}
                                onAddFieldOption={addFieldOption}
                                onApplyOptionPreset={applyOptionPreset}
                                onAddField={addField}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader>
                    <CardTitle>Consent</CardTitle>
                    <CardDescription>
                        This text appears at the end of the patient flow before
                        submission.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="consent-version">Consent version</Label>
                        <Input
                            id="consent-version"
                            value={consentVersion}
                            onChange={(event) =>
                                setConsentVersion(event.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="consent-text">Consent notice</Label>
                        <Textarea
                            id="consent-text"
                            value={consentText}
                            onChange={(event) =>
                                setConsentText(event.target.value)
                            }
                            rows={8}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
                        <FileText className="h-4 w-4" />
                        <span>
                            {enabledSectionCount} sections live, {fieldCount}{" "}
                            total items
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
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
                            ) : (
                                "Create Template"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
