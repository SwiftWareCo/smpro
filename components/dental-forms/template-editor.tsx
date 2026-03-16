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

interface TemplateEditorProps {
    clientId: Id<"clients">;
    template?: Doc<"formTemplates"> | null;
    copyVariant?: "template" | "form";
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
    { value: "multiSelect", label: "Multiple Choice" },
    { value: "signature", label: "Signature" },
    { value: "address", label: "Address" },
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
        return "New radio group";
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
    return fieldType === "radio" || fieldType === "select";
}

function supportsRequired(fieldType: FieldType): boolean {
    return true;
}

// --- Field Editor Dialog ---

interface FieldEditorDialogProps {
    field: TemplateField | null;
    open: boolean;
    sectionId: string;
    onClose: () => void;
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

function FieldEditorDialog({
    field,
    open,
    sectionId,
    onClose,
    onSetFieldType,
    onUpdateField,
    onUpdateFieldOption,
    onRemoveFieldOption,
    onAddFieldOption,
    onApplyOptionPreset,
}: FieldEditorDialogProps) {
    const [showPlaceholder, setShowPlaceholder] = useState(
        () => !!field?.placeholder,
    );

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-lg">
                {!field ? null : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                Edit Field
                                <Badge
                                    variant="outline"
                                    className="rounded-full px-2.5 py-0.5"
                                >
                                    {FIELD_TYPE_LABELS[field.type]}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor={`dialog-field-label-${field.id}`}
                                >
                                    Label or content
                                </Label>
                                <Input
                                    id={`dialog-field-label-${field.id}`}
                                    value={field.label}
                                    onChange={(event) =>
                                        onUpdateField(sectionId, field.id, {
                                            label: event.target.value,
                                        })
                                    }
                                    placeholder={getDefaultFieldLabel(
                                        field.type,
                                    )}
                                    autoFocus
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
                                            disabled={
                                                !supportsRequired(field.type)
                                            }
                                            onCheckedChange={(checked) =>
                                                onUpdateField(
                                                    sectionId,
                                                    field.id,
                                                    {
                                                        required: checked,
                                                    },
                                                )
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

                            {supportsPlaceholder(field.type) &&
                                (showPlaceholder ? (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`dialog-field-placeholder-${field.id}`}
                                        >
                                            Placeholder
                                        </Label>
                                        <Input
                                            id={`dialog-field-placeholder-${field.id}`}
                                            value={field.placeholder ?? ""}
                                            onChange={(event) =>
                                                onUpdateField(
                                                    sectionId,
                                                    field.id,
                                                    {
                                                        placeholder:
                                                            event.target.value,
                                                    },
                                                )
                                            }
                                            placeholder="Optional helper text"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                                        onClick={() => setShowPlaceholder(true)}
                                    >
                                        + Add placeholder
                                    </button>
                                ))}

                            {supportsValidation(field.type) && (
                                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">
                                            Validation rules
                                        </Label>
                                        <Switch
                                            checked={!!field.validation}
                                            onCheckedChange={(checked) =>
                                                onUpdateField(
                                                    sectionId,
                                                    field.id,
                                                    {
                                                        validation: checked
                                                            ? {
                                                                  min: undefined,
                                                                  max: undefined,
                                                                  pattern:
                                                                      undefined,
                                                                  message:
                                                                      undefined,
                                                              }
                                                            : undefined,
                                                    },
                                                )
                                            }
                                        />
                                    </div>
                                    {field.validation && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">
                                                        {field.type === "number"
                                                            ? "Min value"
                                                            : "Min length"}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            field.validation
                                                                .min ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            onUpdateField(
                                                                sectionId,
                                                                field.id,
                                                                {
                                                                    validation:
                                                                        {
                                                                            ...field.validation!,
                                                                            min: e
                                                                                .target
                                                                                .value
                                                                                ? Number(
                                                                                      e
                                                                                          .target
                                                                                          .value,
                                                                                  )
                                                                                : undefined,
                                                                        },
                                                                },
                                                            )
                                                        }
                                                        placeholder="—"
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">
                                                        {field.type === "number"
                                                            ? "Max value"
                                                            : "Max length"}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            field.validation
                                                                .max ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            onUpdateField(
                                                                sectionId,
                                                                field.id,
                                                                {
                                                                    validation:
                                                                        {
                                                                            ...field.validation!,
                                                                            max: e
                                                                                .target
                                                                                .value
                                                                                ? Number(
                                                                                      e
                                                                                          .target
                                                                                          .value,
                                                                                  )
                                                                                : undefined,
                                                                        },
                                                                },
                                                            )
                                                        }
                                                        placeholder="—"
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                            {supportsPattern(field.type) && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">
                                                        Format
                                                    </Label>
                                                    <Select
                                                        value={
                                                            field.validation
                                                                .pattern ??
                                                            "__none"
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            const preset =
                                                                FORMAT_PRESETS.find(
                                                                    (p) =>
                                                                        p.pattern ===
                                                                        value,
                                                                );
                                                            onUpdateField(
                                                                sectionId,
                                                                field.id,
                                                                {
                                                                    validation:
                                                                        {
                                                                            ...field.validation!,
                                                                            pattern:
                                                                                value ===
                                                                                "__none"
                                                                                    ? undefined
                                                                                    : value,
                                                                            message:
                                                                                value ===
                                                                                "__none"
                                                                                    ? field
                                                                                          .validation!
                                                                                          .message
                                                                                    : field
                                                                                          .validation!
                                                                                          .message ||
                                                                                      preset?.message,
                                                                        },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="No format restriction" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__none">
                                                                No format
                                                                restriction
                                                            </SelectItem>
                                                            {FORMAT_PRESETS.map(
                                                                (preset) => (
                                                                    <SelectItem
                                                                        key={
                                                                            preset.pattern
                                                                        }
                                                                        value={
                                                                            preset.pattern
                                                                        }
                                                                    >
                                                                        {
                                                                            preset.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">
                                                    Error message
                                                </Label>
                                                <Input
                                                    value={
                                                        field.validation
                                                            .message ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                validation: {
                                                                    ...field.validation!,
                                                                    message:
                                                                        e.target
                                                                            .value ||
                                                                        undefined,
                                                                },
                                                            },
                                                        )
                                                    }
                                                    placeholder="e.g. Must be a 10-digit Care Card number"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {supportsOptions(field.type) && (
                                <div className="space-y-3">
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
                                                    key={`${field.id}-opt-${optionIndex}`}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Input
                                                        value={option}
                                                        onChange={(event) =>
                                                            onUpdateFieldOption(
                                                                sectionId,
                                                                field.id,
                                                                optionIndex,
                                                                event.target
                                                                    .value,
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
                                            onAddFieldOption(
                                                sectionId,
                                                field.id,
                                            )
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add option
                                    </Button>
                                </div>
                            )}

                            {supportsFollowUp(field.type) && (
                                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">
                                            Follow-up question
                                        </Label>
                                        <Switch
                                            checked={
                                                field.followUp?.enabled ?? false
                                            }
                                            onCheckedChange={(checked) =>
                                                onUpdateField(
                                                    sectionId,
                                                    field.id,
                                                    {
                                                        followUp: checked
                                                            ? {
                                                                  enabled: true,
                                                                  trigger:
                                                                      field
                                                                          .options?.[0] ??
                                                                      "",
                                                                  label: "If yes, please explain",
                                                                  required: false,
                                                              }
                                                            : undefined,
                                                    },
                                                )
                                            }
                                        />
                                    </div>
                                    {field.followUp?.enabled && (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Show when answer is
                                                </Label>
                                                <Select
                                                    value={
                                                        field.followUp.trigger
                                                    }
                                                    onValueChange={(value) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                followUp: {
                                                                    ...field.followUp!,
                                                                    trigger:
                                                                        value,
                                                                },
                                                            },
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(
                                                            field.options ?? []
                                                        ).map((option) => (
                                                            <SelectItem
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Follow-up label
                                                </Label>
                                                <Input
                                                    value={field.followUp.label}
                                                    onChange={(event) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                followUp: {
                                                                    ...field.followUp!,
                                                                    label: event
                                                                        .target
                                                                        .value,
                                                                },
                                                            },
                                                        )
                                                    }
                                                    placeholder="If yes, please explain"
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={
                                                        field.followUp.required
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                followUp: {
                                                                    ...field.followUp!,
                                                                    required:
                                                                        checked,
                                                                },
                                                            },
                                                        )
                                                    }
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {field.followUp.required
                                                        ? "Required when visible"
                                                        : "Optional"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button onClick={onClose}>Done</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// --- Sortable Field Item ---

interface SortableFieldItemProps {
    field: TemplateField;
    fieldIndex: number;
    sectionId: string;
    onEditField: (sectionId: string, fieldId: string) => void;
    onDuplicateField: (sectionId: string, fieldId: string) => void;
    onRemoveField: (sectionId: string, fieldId: string) => void;
}

function SortableFieldItem({
    field,
    fieldIndex,
    sectionId,
    onEditField,
    onDuplicateField,
    onRemoveField,
}: SortableFieldItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex h-full items-center gap-2 rounded-xl border border-border/70 bg-muted/10 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 ${
                isDragging
                    ? "z-50 opacity-80 shadow-lg ring-2 ring-primary/30"
                    : ""
            }`}
        >
            <span
                {...attributes}
                {...listeners}
                className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
            >
                <GripVertical className="h-4 w-4" />
            </span>
            <button
                type="button"
                onClick={() => onEditField(sectionId, field.id)}
                className="flex min-w-0 flex-1 items-center gap-2"
            >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-[10px] font-semibold">
                    {fieldIndex + 1}
                </span>
                <Badge
                    variant="outline"
                    className="shrink-0 rounded-full px-2 py-0 text-[10px]"
                >
                    {FIELD_TYPE_LABELS[field.type]}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm">
                    {field.label || "Untitled"}
                </span>
                {field.required && (
                    <span className="shrink-0 text-xs font-medium text-destructive">
                        *
                    </span>
                )}
                {supportsOptions(field.type) &&
                    field.options &&
                    field.options.length > 0 && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                            {field.options.length} opts
                        </span>
                    )}
                {field.followUp?.enabled && (
                    <Badge
                        variant="outline"
                        className="shrink-0 rounded-full px-1.5 py-0 text-[9px] text-muted-foreground"
                    >
                        +follow-up
                    </Badge>
                )}
            </button>
            <span
                role="button"
                tabIndex={-1}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateField(sectionId, field.id);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        onDuplicateField(sectionId, field.id);
                    }
                }}
            >
                <Copy className="h-3.5 w-3.5" />
            </span>
            <span
                role="button"
                tabIndex={-1}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemoveField(sectionId, field.id);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemoveField(sectionId, field.id);
                    }
                }}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </span>
        </div>
    );
}

// --- Section Card ---

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
    onDuplicateField: (sectionId: string, fieldId: string) => void;
    onRemoveField: (sectionId: string, fieldId: string) => void;
    onEditField: (sectionId: string, fieldId: string) => void;
    onAddField: (sectionId: string, fieldType?: FieldType) => void;
    onReorderFields: (
        sectionId: string,
        oldIndex: number,
        newIndex: number,
    ) => void;
}

const TemplateSectionCard = memo(function TemplateSectionCard({
    section,
    sectionIndex,
    active,
    setSectionRef,
    onSetActiveSection,
    onUpdateSection,
    onRemoveSection,
    onDuplicateField,
    onRemoveField,
    onEditField,
    onAddField,
    onReorderFields,
}: TemplateSectionCardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const fieldIds = useMemo(
        () => section.fields.map((f) => f.id),
        [section.fields],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active: dragActive, over } = event;
            if (!over || dragActive.id === over.id) return;
            const oldIndex = fieldIds.indexOf(dragActive.id as string);
            const newIndex = fieldIds.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                onReorderFields(section.id, oldIndex, newIndex);
            }
        },
        [fieldIds, onReorderFields, section.id],
    );
    return (
        <div
            ref={(node) => {
                setSectionRef(section.id, node);
            }}
            onFocusCapture={() => onSetActiveSection(section.id)}
            className={`scroll-mt-24 rounded-[28px] border bg-background p-5 shadow-sm transition-colors animate-in fade-in-0 slide-in-from-bottom-3 duration-300 ${
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={fieldIds}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 gap-2 md:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] xl:[grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
                                {section.fields.map((field, fieldIndex) => (
                                    <SortableFieldItem
                                        key={field.id}
                                        field={field}
                                        fieldIndex={fieldIndex}
                                        sectionId={section.id}
                                        onEditField={onEditField}
                                        onDuplicateField={onDuplicateField}
                                        onRemoveField={onRemoveField}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
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
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "address")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                    </Button>
                </div>
            </div>
        </div>
    );
});

// --- Main Editor ---

export function TemplateEditor({
    clientId,
    template,
    copyVariant = "template",
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
    const [saving, setSaving] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(
        template?.sections?.[0]?.id ?? "",
    );
    const [editingField, setEditingField] = useState<{
        sectionId: string;
        fieldId: string;
    } | null>(null);
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
                                            followUp: supportsFollowUp(nextType)
                                                ? field.followUp
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
        <div className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-200 space-y-6 pb-24">
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
                        <div className="lg:sticky lg:top-24 lg:self-start">
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
                                    setSectionRef={setSectionRef}
                                    onSetActiveSection={setActiveSection}
                                    onUpdateSection={updateSection}
                                    onRemoveSection={removeSection}
                                    onDuplicateField={duplicateField}
                                    onRemoveField={removeField}
                                    onEditField={openFieldEditor}
                                    onAddField={addField}
                                    onReorderFields={reorderFields}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom bar with section pills + actions */}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="flex w-full items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {sections.map((section, sectionIndex) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => focusSection(section.id)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors animate-in fade-in-0 zoom-in-95 duration-200 ${
                                    activeSectionId === section.id
                                        ? "border-primary/35 bg-primary/10 text-foreground"
                                        : "border-border/70 bg-muted/15 text-muted-foreground hover:bg-muted/30"
                                }`}
                            >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-semibold shadow-sm">
                                    {sectionIndex + 1}
                                </span>
                                <span className="hidden max-w-[80px] truncate sm:inline">
                                    {section.title || "Untitled"}
                                </span>
                                <span
                                    className={`inline-flex h-1.5 w-1.5 rounded-full ${
                                        section.enabled
                                            ? "bg-emerald-500"
                                            : "bg-muted-foreground/40"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
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
                onClose={closeFieldEditor}
                onSetFieldType={setFieldType}
                onUpdateField={updateField}
                onUpdateFieldOption={updateFieldOption}
                onRemoveFieldOption={removeFieldOption}
                onAddFieldOption={addFieldOption}
                onApplyOptionPreset={applyOptionPreset}
            />
        </div>
    );
}
