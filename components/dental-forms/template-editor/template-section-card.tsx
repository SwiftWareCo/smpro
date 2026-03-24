"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import type {
    FieldType,
    TemplateField,
    TemplateSection,
} from "@/lib/validation/dental-form";
import { FIELD_TYPE_LABELS, supportsOptions } from "./utils";

interface SortableFieldItemProps {
    field: TemplateField;
    fieldIndex: number;
    sectionId: string;
    isDragTarget: boolean;
    isBeingDragged: boolean;
    onEditField: (sectionId: string, fieldId: string) => void;
    onDuplicateField: (sectionId: string, fieldId: string) => void;
    onRemoveField: (sectionId: string, fieldId: string) => void;
    onUpdateField: (
        sectionId: string,
        fieldId: string,
        updates: Partial<TemplateField>,
    ) => void;
}

function getEffectiveWidth(
    field: Pick<TemplateField, "type" | "width">,
): TemplateField["width"] {
    if (field.type === "address") return "full";
    return field.width;
}

function getWidthColSpan(field: Pick<TemplateField, "type" | "width">): string {
    const width = getEffectiveWidth(field);
    if (width === "third") return "sm:col-span-2";
    if (width === "full") return "sm:col-span-6";
    return "sm:col-span-3";
}

type UseSortableReturn = ReturnType<typeof useSortable>;

interface FieldItemContentProps {
    field: TemplateField;
    fieldIndex: number;
    sectionId: string;
    dragHandleProps?: {
        attributes: UseSortableReturn["attributes"];
        listeners: UseSortableReturn["listeners"];
    };
    onEditField: (sectionId: string, fieldId: string) => void;
    onDuplicateField: (sectionId: string, fieldId: string) => void;
    onRemoveField: (sectionId: string, fieldId: string) => void;
    onUpdateField: (
        sectionId: string,
        fieldId: string,
        updates: Partial<TemplateField>,
    ) => void;
}

function FieldItemContent({
    field,
    fieldIndex,
    sectionId,
    dragHandleProps,
    onEditField,
    onDuplicateField,
    onRemoveField,
    onUpdateField,
}: FieldItemContentProps) {
    const displayLabel = field.label || "Untitled";
    const isThirdWidth = (getEffectiveWidth(field) ?? "half") === "third";
    const shouldShowLabel = !isThirdWidth || displayLabel.length <= 12;

    return (
        <>
            {dragHandleProps && (
                <span
                    {...dragHandleProps.attributes}
                    {...dragHandleProps.listeners}
                    className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </span>
            )}
            {!dragHandleProps && (
                <span className="shrink-0 rounded p-0.5 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                </span>
            )}
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
                {shouldShowLabel && (
                    <span
                        className="min-w-0 flex-1 truncate text-sm"
                        title={displayLabel}
                    >
                        {displayLabel}
                    </span>
                )}
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
                {(field.followUps?.length ?? 0) > 0 && (
                    <Badge
                        variant="outline"
                        className="shrink-0 rounded-full px-1.5 py-0 text-[9px] text-muted-foreground"
                    >
                        +{field.followUps!.length} follow-up
                        {field.followUps!.length > 1 ? "s" : ""}
                    </Badge>
                )}
            </button>
            <div className="flex shrink-0 items-center rounded-lg border border-border/60 bg-background">
                {field.type === "address" ? (
                    <span className="px-2 py-1 text-xs font-medium text-primary">
                        Full
                    </span>
                ) : (
                    (["third", "half", "full"] as const).map((w) => {
                        const active = (field.width ?? "half") === w;
                        const label =
                            w === "third"
                                ? "1/3"
                                : w === "half"
                                  ? "1/2"
                                  : "Full";
                        return (
                            <button
                                key={w}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateField(sectionId, field.id, {
                                        width: w,
                                    });
                                }}
                                className={`px-2 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                                    active
                                        ? "bg-primary/15 text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })
                )}
            </div>
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
        </>
    );
}

function SortableFieldItem({
    field,
    fieldIndex,
    sectionId,
    isDragTarget,
    isBeingDragged,
    onEditField,
    onDuplicateField,
    onRemoveField,
    onUpdateField,
}: SortableFieldItemProps) {
    const { attributes, listeners, setNodeRef } = useSortable({ id: field.id });

    return (
        <div
            ref={setNodeRef}
            className={`flex h-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color,opacity] duration-150 ${
                isBeingDragged
                    ? "opacity-0"
                    : isDragTarget
                      ? "border-dashed border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/70 bg-muted/10 hover:border-primary/30 hover:bg-primary/5"
            }`}
        >
            <FieldItemContent
                field={field}
                fieldIndex={fieldIndex}
                sectionId={sectionId}
                dragHandleProps={{ attributes, listeners }}
                onEditField={onEditField}
                onDuplicateField={onDuplicateField}
                onRemoveField={onRemoveField}
                onUpdateField={onUpdateField}
            />
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
    onUpdateField: (
        sectionId: string,
        fieldId: string,
        updates: Partial<TemplateField>,
    ) => void;
}

export const TemplateSectionCard = memo(function TemplateSectionCard({
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
    onUpdateField,
}: TemplateSectionCardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    const fieldIds = useMemo(
        () => section.fields.map((f) => f.id),
        [section.fields],
    );
    const activeField = activeId
        ? section.fields.find((f) => f.id === activeId)
        : null;
    const activeFieldIndex = activeField
        ? section.fields.indexOf(activeField)
        : -1;

    const collisionDetection = useCallback<CollisionDetection>((args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        return closestCenter(args);
    }, []);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const newOverId = (event.over?.id as string) ?? null;
        setOverId((prev) => (prev === newOverId ? prev : newOverId));
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
                const oldIndex = section.fields.findIndex(
                    (f) => f.id === active.id,
                );
                const newIndex = section.fields.findIndex(
                    (f) => f.id === over.id,
                );
                if (oldIndex !== -1 && newIndex !== -1) {
                    onReorderFields(section.id, oldIndex, newIndex);
                }
            }
            setActiveId(null);
            setOverId(null);
        },
        [section.fields, section.id, onReorderFields],
    );

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setOverId(null);
    }, []);
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
                        collisionDetection={collisionDetection}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableContext items={fieldIds}>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
                                {section.fields.map((field, fieldIndex) => (
                                    <div
                                        key={field.id}
                                        className={getWidthColSpan(field)}
                                    >
                                        <SortableFieldItem
                                            field={field}
                                            fieldIndex={fieldIndex}
                                            sectionId={section.id}
                                            isDragTarget={
                                                field.id === overId &&
                                                field.id !== activeId
                                            }
                                            isBeingDragged={
                                                field.id === activeId
                                            }
                                            onEditField={onEditField}
                                            onDuplicateField={onDuplicateField}
                                            onRemoveField={onRemoveField}
                                            onUpdateField={onUpdateField}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay
                            dropAnimation={{
                                duration: 150,
                                easing: "ease",
                            }}
                        >
                            {activeField ? (
                                <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 shadow-xl ring-2 ring-primary/30">
                                    <FieldItemContent
                                        field={activeField}
                                        fieldIndex={activeFieldIndex}
                                        sectionId={section.id}
                                        onEditField={onEditField}
                                        onDuplicateField={onDuplicateField}
                                        onRemoveField={onRemoveField}
                                        onUpdateField={onUpdateField}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
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
                        Add Field Option
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
                        onClick={() => onAddField(section.id, "radio")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Single Choice
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onAddField(section.id, "date")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Date
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
