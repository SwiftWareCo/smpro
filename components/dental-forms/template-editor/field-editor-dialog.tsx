"use client";

import React, { useRef, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type {
    FieldType,
    FollowUpField,
    TemplateField,
} from "@/lib/validation/dental-form";
import {
    createFollowUp,
    FIELD_TYPES,
    FIELD_TYPE_LABELS,
    FOLLOW_UP_TYPES,
    FORMAT_PRESETS,
    HIDDEN_SCROLL_AREA_CLASS,
    HIDDEN_SCROLLBAR_CLASS,
    OPTION_PRESETS,
    supportsFollowUp,
    supportsOptions,
    supportsPattern,
    supportsPlaceholder,
    supportsRequired,
    supportsValidation,
    getDefaultFieldLabel,
    isChoiceType,
} from "./utils";

const PARAGRAPH_FONT_SIZE_OPTIONS = [
    { value: "sm", label: "Small" },
    { value: "base", label: "Medium" },
    { value: "lg", label: "Large" },
    { value: "xl", label: "XL" },
] as const;

function OptionInput({
    value,
    placeholder,
    onChange,
    className,
}: {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    const [local, setLocal] = useState(value);
    const ref = useRef(value);
    // Sync when parent value changes externally (e.g. preset applied)
    if (ref.current !== value && local === ref.current) {
        setLocal(value);
    }
    ref.current = value;

    return (
        <Input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => {
                if (local !== value) onChange(local);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.currentTarget.blur();
                }
            }}
            placeholder={placeholder}
            className={className}
        />
    );
}

export interface FieldEditorDialogProps {
    field: TemplateField | null;
    open: boolean;
    sectionId: string;
    dialogClassName?: string;
    dialogStyle?: React.CSSProperties;
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

export function FieldEditorDialog({
    field,
    open,
    sectionId,
    dialogClassName,
    dialogStyle,
    onClose,
    onSetFieldType,
    onUpdateField,
    onRemoveFieldOption,
    onAddFieldOption,
    onApplyOptionPreset,
}: FieldEditorDialogProps) {
    const [showPlaceholder, setShowPlaceholder] = useState(
        () => !!field?.placeholder,
    );
    const [editingFollowUpIndex, setEditingFollowUpIndex] = useState<
        number | null
    >(null);

    // Reset follow-up panel when dialog closes or field changes
    const prevFieldId = useRef(field?.id);
    if (field?.id !== prevFieldId.current) {
        prevFieldId.current = field?.id;
        if (editingFollowUpIndex !== null) setEditingFollowUpIndex(null);
    }

    const editingFollowUp =
        editingFollowUpIndex !== null
            ? ((field?.followUps ?? [])[editingFollowUpIndex] ?? null)
            : null;

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    setEditingFollowUpIndex(null);
                    onClose();
                }
            }}
        >
            <DialogContent
                className={`${editingFollowUpIndex != null ? "sm:!max-w-4xl" : "sm:max-w-lg"} grid-rows-[auto_1fr_auto] !max-h-[calc(100dvh-4rem)] overflow-hidden p-0${dialogClassName ? ` ${dialogClassName}` : ""}`}
                style={dialogStyle}
            >
                {!field ? null : (
                    <>
                        <DialogHeader className="px-6 pt-6">
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

                        <div className="flex min-h-0 overflow-x-hidden border-y border-border/60">
                            {/* Left panel: main field editor */}
                            <div
                                className={`min-h-0 w-full min-w-0 shrink px-6 py-4 overflow-y-auto overflow-x-hidden ${HIDDEN_SCROLLBAR_CLASS}`}
                                style={{
                                    maxWidth:
                                        editingFollowUpIndex != null
                                            ? "480px"
                                            : "100%",
                                }}
                            >
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`dialog-field-label-${field.id}`}
                                        >
                                            {field.type === "paragraph"
                                                ? "Paragraph text"
                                                : "Label or content"}
                                        </Label>
                                        {field.type === "paragraph" ? (
                                            <Textarea
                                                className="[field-sizing:fixed]"
                                                id={`dialog-field-label-${field.id}`}
                                                value={field.label}
                                                rows={3}
                                                onChange={(event) =>
                                                    onUpdateField(
                                                        sectionId,
                                                        field.id,
                                                        {
                                                            label: event.target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                placeholder={getDefaultFieldLabel(
                                                    field.type,
                                                )}
                                                autoFocus
                                            />
                                        ) : (
                                            <Input
                                                id={`dialog-field-label-${field.id}`}
                                                value={field.label}
                                                onChange={(event) =>
                                                    onUpdateField(
                                                        sectionId,
                                                        field.id,
                                                        {
                                                            label: event.target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                placeholder={getDefaultFieldLabel(
                                                    field.type,
                                                )}
                                                autoFocus
                                            />
                                        )}
                                    </div>

                                    <div
                                        className={`grid gap-4${field.type !== "paragraph" ? " sm:grid-cols-[minmax(0,1fr)_160px]" : ""}`}
                                    >
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
                                                <SelectContent
                                                    className={dialogClassName}
                                                >
                                                    {FIELD_TYPES.map(
                                                        (fieldType) => (
                                                            <SelectItem
                                                                key={
                                                                    fieldType.value
                                                                }
                                                                value={
                                                                    fieldType.value
                                                                }
                                                            >
                                                                {
                                                                    fieldType.label
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {field.type !== "paragraph" && (
                                            <div className="space-y-2">
                                                <Label>Required</Label>
                                                <div className="flex h-10 items-center rounded-xl border border-border/70 bg-background px-3">
                                                    <Switch
                                                        checked={field.required}
                                                        disabled={
                                                            !supportsRequired(
                                                                field.type,
                                                            )
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            onUpdateField(
                                                                sectionId,
                                                                field.id,
                                                                {
                                                                    required:
                                                                        checked,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    <span className="ml-3 text-sm text-muted-foreground">
                                                        {supportsRequired(
                                                            field.type,
                                                        )
                                                            ? field.required
                                                                ? "Required"
                                                                : "Optional"
                                                            : "Display only"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {field.type === "paragraph" && (
                                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                                            <div className="space-y-2">
                                                <Label>Font size</Label>
                                                <Select
                                                    value={
                                                        field.paragraphStyle
                                                            ?.fontSize ?? "base"
                                                    }
                                                    onValueChange={(value) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                paragraphStyle:
                                                                    {
                                                                        ...field.paragraphStyle,
                                                                        fontSize:
                                                                            value as
                                                                                | "sm"
                                                                                | "base"
                                                                                | "lg"
                                                                                | "xl",
                                                                    },
                                                            },
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        className={
                                                            dialogClassName
                                                        }
                                                    >
                                                        {PARAGRAPH_FONT_SIZE_OPTIONS.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Weight</Label>
                                                <Select
                                                    value={
                                                        field.paragraphStyle
                                                            ?.bold
                                                            ? "bold"
                                                            : "regular"
                                                    }
                                                    onValueChange={(v) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                paragraphStyle:
                                                                    {
                                                                        ...field.paragraphStyle,
                                                                        bold:
                                                                            v ===
                                                                            "bold",
                                                                    },
                                                            },
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        className={
                                                            dialogClassName
                                                        }
                                                    >
                                                        <SelectItem value="regular">
                                                            Regular
                                                        </SelectItem>
                                                        <SelectItem value="bold">
                                                            Bold
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

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
                                                    value={
                                                        field.placeholder ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                placeholder:
                                                                    event.target
                                                                        .value,
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
                                                onClick={() =>
                                                    setShowPlaceholder(true)
                                                }
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
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                validation:
                                                                    checked
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
                                                                {field.type ===
                                                                "number"
                                                                    ? "Min value"
                                                                    : "Min length"}
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    field
                                                                        .validation
                                                                        .min ??
                                                                    ""
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
                                                                {field.type ===
                                                                "number"
                                                                    ? "Max value"
                                                                    : "Max length"}
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    field
                                                                        .validation
                                                                        .max ??
                                                                    ""
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
                                                    {supportsPattern(
                                                        field.type,
                                                    ) && (
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-muted-foreground">
                                                                Format
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    field
                                                                        .validation
                                                                        .pattern ??
                                                                    "__none"
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const preset =
                                                                        FORMAT_PRESETS.find(
                                                                            (
                                                                                p,
                                                                            ) =>
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
                                                                <SelectContent
                                                                    className={
                                                                        dialogClassName
                                                                    }
                                                                >
                                                                    <SelectItem value="__none">
                                                                        No
                                                                        format
                                                                        restriction
                                                                    </SelectItem>
                                                                    {FORMAT_PRESETS.map(
                                                                        (
                                                                            preset,
                                                                        ) => (
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
                                                                    .message ??
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                onUpdateField(
                                                                    sectionId,
                                                                    field.id,
                                                                    {
                                                                        validation:
                                                                            {
                                                                                ...field.validation!,
                                                                                message:
                                                                                    e
                                                                                        .target
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
                                                    {OPTION_PRESETS.map(
                                                        (preset) => (
                                                            <Button
                                                                key={
                                                                    preset.label
                                                                }
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
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-border/70 bg-muted/5">
                                                <ScrollArea
                                                    className={`max-h-[240px] overflow-y-scroll ${HIDDEN_SCROLL_AREA_CLASS}`}
                                                >
                                                    <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
                                                        {(field.options ?? []).map(
                                                            (
                                                                option,
                                                                optionIndex,
                                                            ) => (
                                                                <div
                                                                    key={`${field.id}-opt-${optionIndex}`}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <OptionInput
                                                                        value={
                                                                            option
                                                                        }
                                                                        onChange={(
                                                                            newValue,
                                                                        ) =>
                                                                            onUpdateField(
                                                                                sectionId,
                                                                                field.id,
                                                                                {
                                                                                    options:
                                                                                        (field.options ?? []).map(
                                                                                            (o, i) =>
                                                                                                i === optionIndex
                                                                                                    ? newValue
                                                                                                    : o,
                                                                                        ),
                                                                                },
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
                                                </ScrollArea>
                                                <div className="border-t border-border/70 px-3 py-2">
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
                                            </div>
                                        </div>
                                    )}

                                    {supportsFollowUp(field.type) && (
                                        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">
                                                    Follow-up questions
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 rounded-full px-3 text-xs"
                                                    disabled={
                                                        (field.followUps
                                                            ?.length ?? 0) >= 5
                                                    }
                                                    onClick={() => {
                                                        const newFu =
                                                            createFollowUp(
                                                                field,
                                                            );
                                                        const newFollowUps = [
                                                            ...(field.followUps ??
                                                                []),
                                                            newFu,
                                                        ];
                                                        onUpdateField(
                                                            sectionId,
                                                            field.id,
                                                            {
                                                                followUps:
                                                                    newFollowUps,
                                                            },
                                                        );
                                                        setEditingFollowUpIndex(
                                                            newFollowUps.length -
                                                                1,
                                                        );
                                                    }}
                                                >
                                                    <Plus className="mr-1 h-3 w-3" />
                                                    Add follow-up
                                                </Button>
                                            </div>
                                            {/* Compact follow-up card list */}
                                            {(field.followUps ?? []).length >
                                                0 && (
                                                <div className="space-y-1.5">
                                                    {(
                                                        field.followUps ?? []
                                                    ).map((fu, fuIndex) => (
                                                        <div
                                                            key={fu.id}
                                                            onClick={() =>
                                                                setEditingFollowUpIndex(
                                                                    fuIndex,
                                                                )
                                                            }
                                                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${editingFollowUpIndex === fuIndex ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-xs font-medium truncate">
                                                                    {fu.label ||
                                                                        `Follow-up ${fuIndex + 1}`}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="shrink-0 text-[10px] px-1.5 py-0"
                                                                >
                                                                    {fu.type}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        const next =
                                                                            (
                                                                                field.followUps ??
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    _,
                                                                                    i,
                                                                                ) =>
                                                                                    i !==
                                                                                    fuIndex,
                                                                            );
                                                                        onUpdateField(
                                                                            sectionId,
                                                                            field.id,
                                                                            {
                                                                                followUps:
                                                                                    next.length >
                                                                                    0
                                                                                        ? next
                                                                                        : undefined,
                                                                            },
                                                                        );
                                                                        if (
                                                                            editingFollowUpIndex ===
                                                                            fuIndex
                                                                        ) {
                                                                            setEditingFollowUpIndex(
                                                                                null,
                                                                            );
                                                                        } else if (
                                                                            editingFollowUpIndex !==
                                                                                null &&
                                                                            fuIndex <
                                                                                editingFollowUpIndex
                                                                        ) {
                                                                            setEditingFollowUpIndex(
                                                                                editingFollowUpIndex -
                                                                                    1,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Arrow connector + Right panel: follow-up editor */}
                            {editingFollowUp &&
                                editingFollowUpIndex !== null &&
                                field &&
                                (() => {
                                    const fu = editingFollowUp;
                                    const fuIndex = editingFollowUpIndex;
                                    const updateFollowUp = (
                                        patch: Partial<typeof fu>,
                                    ) => {
                                        const updated = [
                                            ...(field.followUps ?? []),
                                        ];
                                        updated[fuIndex] = { ...fu, ...patch };
                                        onUpdateField(sectionId, field.id, {
                                            followUps: updated,
                                        });
                                    };
                                    return (
                                        <>
                                            <div className="hidden sm:flex items-center px-1 shrink-0">
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="hidden sm:block w-px shrink-0 bg-border" />
                                            <div
                                                className={`min-h-0 w-full sm:min-w-[340px] sm:max-w-md shrink-0 px-5 py-4 overflow-y-auto overflow-x-hidden ${HIDDEN_SCROLLBAR_CLASS}`}
                                            >
                                                <div className="grid gap-3 py-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            Follow-up{" "}
                                                            {fuIndex + 1}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-muted-foreground"
                                                            onClick={() =>
                                                                setEditingFollowUpIndex(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Close
                                                        </Button>
                                                    </div>

                                                    {/* Type + Width selectors */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-muted-foreground">
                                                                Type
                                                            </Label>
                                                            <Select
                                                                value={fu.type}
                                                                onValueChange={(
                                                                    val,
                                                                ) => {
                                                                    const fuType =
                                                                        val as FollowUpField["type"];
                                                                    updateFollowUp(
                                                                        {
                                                                            type: fuType,
                                                                            options:
                                                                                supportsOptions(
                                                                                    fuType as FieldType,
                                                                                )
                                                                                    ? (fu.options ?? [
                                                                                          "Option 1",
                                                                                          "Option 2",
                                                                                      ])
                                                                                    : undefined,
                                                                            required:
                                                                                fuType ===
                                                                                "paragraph"
                                                                                    ? false
                                                                                    : fu.required,
                                                                            paragraphStyle:
                                                                                fuType ===
                                                                                "paragraph"
                                                                                    ? (fu.paragraphStyle ?? {
                                                                                          fontSize:
                                                                                              "base",
                                                                                          bold: false,
                                                                                      })
                                                                                    : undefined,
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent
                                                                    className={
                                                                        dialogClassName
                                                                    }
                                                                >
                                                                    {FOLLOW_UP_TYPES.map(
                                                                        (
                                                                            ft,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    ft.value
                                                                                }
                                                                                value={
                                                                                    ft.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    ft.label
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-muted-foreground">
                                                                Width
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    fu.width ??
                                                                    "half"
                                                                }
                                                                onValueChange={(
                                                                    val,
                                                                ) =>
                                                                    updateFollowUp(
                                                                        {
                                                                            width: val as
                                                                                | "third"
                                                                                | "half"
                                                                                | "full",
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent
                                                                    className={
                                                                        dialogClassName
                                                                    }
                                                                >
                                                                    <SelectItem value="third">
                                                                        1/3
                                                                    </SelectItem>
                                                                    <SelectItem value="half">
                                                                        1/2
                                                                    </SelectItem>
                                                                    <SelectItem value="full">
                                                                        Full
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {fu.type ===
                                                        "paragraph" && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs text-muted-foreground">
                                                                    Font size
                                                                </Label>
                                                                <Select
                                                                    value={
                                                                        fu
                                                                            .paragraphStyle
                                                                            ?.fontSize ??
                                                                        "base"
                                                                    }
                                                                    onValueChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateFollowUp(
                                                                            {
                                                                                paragraphStyle:
                                                                                    {
                                                                                        ...fu.paragraphStyle,
                                                                                        fontSize:
                                                                                            value as
                                                                                                | "sm"
                                                                                                | "base"
                                                                                                | "lg"
                                                                                                | "xl",
                                                                                    },
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent
                                                                        className={
                                                                            dialogClassName
                                                                        }
                                                                    >
                                                                        {PARAGRAPH_FONT_SIZE_OPTIONS.map(
                                                                            (
                                                                                option,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        option.value
                                                                                    }
                                                                                    value={
                                                                                        option.value
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        option.label
                                                                                    }
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs text-muted-foreground">
                                                                    Weight
                                                                </Label>
                                                                <Select
                                                                    value={
                                                                        fu
                                                                            .paragraphStyle
                                                                            ?.bold
                                                                            ? "bold"
                                                                            : "regular"
                                                                    }
                                                                    onValueChange={(
                                                                        v,
                                                                    ) =>
                                                                        updateFollowUp(
                                                                            {
                                                                                paragraphStyle:
                                                                                    {
                                                                                        ...fu.paragraphStyle,
                                                                                        bold:
                                                                                            v ===
                                                                                            "bold",
                                                                                    },
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent
                                                                        className={
                                                                            dialogClassName
                                                                        }
                                                                    >
                                                                        <SelectItem value="regular">
                                                                            Regular
                                                                        </SelectItem>
                                                                        <SelectItem value="bold">
                                                                            Bold
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Label */}
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            {fu.type ===
                                                            "paragraph"
                                                                ? "Paragraph text"
                                                                : "Label"}
                                                        </Label>
                                                        {fu.type ===
                                                        "paragraph" ? (
                                                            <Textarea
                                                                value={fu.label}
                                                                rows={2}
                                                                onChange={(e) =>
                                                                    updateFollowUp(
                                                                        {
                                                                            label: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="h-auto text-xs"
                                                            />
                                                        ) : (
                                                            <Input
                                                                value={fu.label}
                                                                onChange={(e) =>
                                                                    updateFollowUp(
                                                                        {
                                                                            label: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Follow-up label"
                                                                className="h-8 text-xs"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Trigger selector */}
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Show when
                                                        </Label>
                                                        {isChoiceType(
                                                            field.type,
                                                        ) ? (
                                                            <div className="space-y-1.5 rounded-lg border border-border/50 p-2">
                                                                <label className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={fu.triggers.includes(
                                                                            "__any__",
                                                                        )}
                                                                        onCheckedChange={(
                                                                            checked,
                                                                        ) => {
                                                                            updateFollowUp(
                                                                                {
                                                                                    triggers:
                                                                                        checked ===
                                                                                        true
                                                                                            ? [
                                                                                                  "__any__",
                                                                                              ]
                                                                                            : [
                                                                                                  field
                                                                                                      .options?.[0] ??
                                                                                                      "__any__",
                                                                                              ],
                                                                                },
                                                                            );
                                                                        }}
                                                                    />
                                                                    <span className="text-xs font-medium">
                                                                        Any
                                                                        value
                                                                    </span>
                                                                </label>
                                                                {!fu.triggers.includes(
                                                                    "__any__",
                                                                ) &&
                                                                    (
                                                                        field.options ??
                                                                        []
                                                                    ).map(
                                                                        (
                                                                            opt,
                                                                        ) => (
                                                                            <label
                                                                                key={
                                                                                    opt
                                                                                }
                                                                                className="flex items-center gap-2"
                                                                            >
                                                                                <Checkbox
                                                                                    checked={fu.triggers.includes(
                                                                                        opt,
                                                                                    )}
                                                                                    onCheckedChange={(
                                                                                        checked,
                                                                                    ) => {
                                                                                        const newTriggers =
                                                                                            checked ===
                                                                                            true
                                                                                                ? [
                                                                                                      ...fu.triggers.filter(
                                                                                                          (
                                                                                                              t,
                                                                                                          ) =>
                                                                                                              t !==
                                                                                                              "__any__",
                                                                                                      ),
                                                                                                      opt,
                                                                                                  ]
                                                                                                : fu.triggers.filter(
                                                                                                      (
                                                                                                          t,
                                                                                                      ) =>
                                                                                                          t !==
                                                                                                          opt,
                                                                                                  );
                                                                                        updateFollowUp(
                                                                                            {
                                                                                                triggers:
                                                                                                    newTriggers.length >
                                                                                                    0
                                                                                                        ? newTriggers
                                                                                                        : [
                                                                                                              "__any__",
                                                                                                          ],
                                                                                            },
                                                                                        );
                                                                                    }}
                                                                                />
                                                                                <span className="text-xs">
                                                                                    {
                                                                                        opt
                                                                                    }
                                                                                </span>
                                                                            </label>
                                                                        ),
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <p className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                                                                Any non-empty
                                                                input
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Options for choice-type follow-ups */}
                                                    {supportsOptions(
                                                        fu.type as FieldType,
                                                    ) && (
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-muted-foreground">
                                                                Choices
                                                            </Label>
                                                            <div className="rounded-lg border border-border/70 bg-muted/5">
                                                                <ScrollArea
                                                                    className={`max-h-[160px] overflow-y-scroll ${HIDDEN_SCROLL_AREA_CLASS}`}
                                                                >
                                                                    <div className="grid grid-cols-1 gap-1.5 p-2">
                                                                        {(
                                                                            fu.options ??
                                                                            []
                                                                        ).map(
                                                                            (
                                                                                opt,
                                                                                optIdx,
                                                                            ) => (
                                                                                <div
                                                                                    key={`${fu.id}-opt-${optIdx}`}
                                                                                    className="flex items-center gap-1.5"
                                                                                >
                                                                                    <OptionInput
                                                                                        value={
                                                                                            opt
                                                                                        }
                                                                                        onChange={(
                                                                                            newValue,
                                                                                        ) => {
                                                                                            const newOpts =
                                                                                                [
                                                                                                    ...(fu.options ??
                                                                                                        []),
                                                                                                ];
                                                                                            newOpts[
                                                                                                optIdx
                                                                                            ] =
                                                                                                newValue;
                                                                                            updateFollowUp(
                                                                                                {
                                                                                                    options:
                                                                                                        newOpts,
                                                                                                },
                                                                                            );
                                                                                        }}
                                                                                        placeholder={`Option ${optIdx + 1}`}
                                                                                        className="h-7 text-xs"
                                                                                    />
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                                                                        onClick={() =>
                                                                                            updateFollowUp(
                                                                                                {
                                                                                                    options:
                                                                                                        (
                                                                                                            fu.options ??
                                                                                                            []
                                                                                                        ).filter(
                                                                                                            (
                                                                                                                _,
                                                                                                                i,
                                                                                                            ) =>
                                                                                                                i !==
                                                                                                                optIdx,
                                                                                                        ),
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </ScrollArea>
                                                                <div className="border-t border-border/70 px-2 py-1.5">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                        onClick={() =>
                                                                            updateFollowUp(
                                                                                {
                                                                                    options:
                                                                                        [
                                                                                            ...(fu.options ??
                                                                                                []),
                                                                                            `Option ${(fu.options ?? []).length + 1}`,
                                                                                        ],
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <Plus className="mr-1 h-3 w-3" />
                                                                        Add
                                                                        option
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Required toggle (not for paragraph) */}
                                                    {fu.type !==
                                                        "paragraph" && (
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={
                                                                    fu.required
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    updateFollowUp(
                                                                        {
                                                                            required:
                                                                                checked,
                                                                        },
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-xs text-muted-foreground">
                                                                {fu.required
                                                                    ? "Required when visible"
                                                                    : "Optional"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                        </div>

                        <DialogFooter className="px-6 py-4">
                            <Button onClick={onClose}>Done</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
