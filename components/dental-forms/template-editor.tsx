"use client";

import { useState } from "react";
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
import {
    ArrowLeft,
    FileText,
    Loader2,
    Plus,
    Rows3,
    Trash2,
} from "lucide-react";
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
    { value: "textarea", label: "Long Text" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Single Choice" },
    { value: "checkbox", label: "Checkbox" },
    { value: "signature", label: "Signature" },
    { value: "heading", label: "Heading" },
    { value: "paragraph", label: "Paragraph" },
];

const DEFAULT_DENTAL_SECTIONS: TemplateSection[] = [
    {
        id: "personal-info",
        title: "Personal Information",
        description: "Basic patient contact information",
        enabled: true,
        fields: [
            {
                id: "first-name",
                type: "text",
                label: "First Name",
                required: true,
            },
            {
                id: "last-name",
                type: "text",
                label: "Last Name",
                required: true,
            },
            {
                id: "date-of-birth",
                type: "date",
                label: "Date of Birth",
                required: true,
            },
            {
                id: "email",
                type: "email",
                label: "Email Address",
                required: true,
            },
            {
                id: "phone",
                type: "phone",
                label: "Phone Number",
                required: true,
            },
            {
                id: "address",
                type: "textarea",
                label: "Address",
                required: false,
            },
        ],
    },
    {
        id: "emergency-contact",
        title: "Emergency Contact",
        enabled: true,
        fields: [
            {
                id: "emergency-name",
                type: "text",
                label: "Emergency Contact Name",
                required: true,
            },
            {
                id: "emergency-phone",
                type: "phone",
                label: "Emergency Contact Phone",
                required: true,
            },
            {
                id: "emergency-relationship",
                type: "text",
                label: "Relationship",
                required: true,
            },
        ],
    },
    {
        id: "medical-history",
        title: "Medical History",
        description: "Current health conditions and medications",
        enabled: true,
        fields: [
            {
                id: "physician-name",
                type: "text",
                label: "Family Physician Name",
                required: false,
            },
            {
                id: "physician-phone",
                type: "phone",
                label: "Physician Phone",
                required: false,
            },
            {
                id: "current-medications",
                type: "textarea",
                label: "Current Medications",
                placeholder: "List all current medications...",
                required: false,
            },
            {
                id: "allergies",
                type: "textarea",
                label: "Allergies",
                placeholder: "List any known allergies...",
                required: false,
            },
            {
                id: "medical-conditions",
                type: "textarea",
                label: "Medical Conditions",
                placeholder: "List any current or past medical conditions...",
                required: false,
            },
            {
                id: "pregnant",
                type: "radio",
                label: "Are you currently pregnant?",
                required: false,
                options: ["Yes", "No", "N/A"],
            },
        ],
    },
    {
        id: "dental-history",
        title: "Dental History",
        enabled: true,
        fields: [
            {
                id: "last-dental-visit",
                type: "date",
                label: "Date of Last Dental Visit",
                required: false,
            },
            {
                id: "previous-dentist",
                type: "text",
                label: "Previous Dentist Name",
                required: false,
            },
            {
                id: "reason-for-visit",
                type: "select",
                label: "Reason for Visit",
                required: true,
                options: [
                    "Regular Check-up",
                    "Dental Pain",
                    "Cosmetic Concern",
                    "Emergency",
                    "Second Opinion",
                    "Other",
                ],
            },
            {
                id: "dental-concerns",
                type: "textarea",
                label: "Dental Concerns or Symptoms",
                placeholder: "Describe any current dental concerns...",
                required: false,
            },
            {
                id: "brushing-frequency",
                type: "select",
                label: "How often do you brush?",
                required: false,
                options: ["Twice daily", "Once daily", "Less than daily"],
            },
            {
                id: "flossing-frequency",
                type: "select",
                label: "How often do you floss?",
                required: false,
                options: ["Daily", "A few times a week", "Rarely", "Never"],
            },
        ],
    },
    {
        id: "insurance",
        title: "Insurance Information",
        enabled: true,
        fields: [
            {
                id: "has-insurance",
                type: "radio",
                label: "Do you have dental insurance?",
                required: true,
                options: ["Yes", "No"],
            },
            {
                id: "insurance-provider",
                type: "text",
                label: "Insurance Provider",
                required: false,
            },
            {
                id: "policy-number",
                type: "text",
                label: "Policy Number",
                required: false,
            },
            {
                id: "group-number",
                type: "text",
                label: "Group Number",
                required: false,
            },
            {
                id: "subscriber-name",
                type: "text",
                label: "Subscriber Name (if different)",
                required: false,
            },
        ],
    },
    {
        id: "signature",
        title: "Patient Signature",
        enabled: true,
        fields: [
            {
                id: "patient-signature",
                type: "signature",
                label: "Patient Signature",
                required: true,
            },
            {
                id: "signature-date",
                type: "date",
                label: "Date",
                required: true,
            },
        ],
    },
];

function generateId(): string {
    return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function supportsPlaceholder(fieldType: FieldType): boolean {
    return !["date", "select", "radio", "signature"].includes(fieldType);
}

function supportsOptions(fieldType: FieldType): boolean {
    return fieldType === "select" || fieldType === "radio";
}

function supportsRequired(fieldType: FieldType): boolean {
    return fieldType !== "heading" && fieldType !== "paragraph";
}

export function TemplateEditor({
    clientId,
    template,
    onClose,
}: TemplateEditorProps) {
    const isEditing = !!template;
    const [name, setName] = useState(template?.name ?? "New Patient Intake Form");
    const [description, setDescription] = useState(
        template?.description ?? "Standard dental patient intake form",
    );
    const [sections, setSections] = useState<TemplateSection[]>(
        template?.sections ?? DEFAULT_DENTAL_SECTIONS,
    );
    const [consentText, setConsentText] = useState(
        template?.consentText ?? DEFAULT_PIPA_CONSENT_TEXT,
    );
    const [consentVersion, setConsentVersion] = useState(
        template?.consentVersion ?? DEFAULT_CONSENT_VERSION,
    );
    const [saving, setSaving] = useState(false);

    const createTemplate = useMutation(api.formTemplates.create);
    const updateTemplate = useMutation(api.formTemplates.update);

    const updateSection = (
        sectionId: string,
        updates: Partial<Omit<TemplateSection, "fields">>,
    ) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId ? { ...section, ...updates } : section,
            ),
        );
    };

    const addSection = () => {
        setSections((prev) => [
            ...prev,
            {
                id: generateId(),
                title: "New Section",
                description: "",
                enabled: true,
                fields: [],
            },
        ]);
    };

    const removeSection = (sectionId: string) => {
        setSections((prev) => prev.filter((section) => section.id !== sectionId));
    };

    const addField = (sectionId: string) => {
        const newField: TemplateField = {
            id: generateId(),
            type: "text",
            label: "New Field",
            required: false,
            placeholder: "",
        };

        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? { ...section, fields: [...section.fields, newField] }
                    : section,
            ),
        );
    };

    const updateField = (
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
    };

    const removeField = (sectionId: string, fieldId: string) => {
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
    };

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

    const enabledSectionCount = sections.filter((section) => section.enabled).length;
    const fieldCount = sections.reduce(
        (count, section) => count + section.fields.length,
        0,
    );

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-24">
            <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="rounded-full px-3 py-1">
                                    {isEditing ? "Editing template" : "New template"}
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    Patients see sections in this order
                                </Badge>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    {isEditing
                                        ? "Refine the patient intake flow"
                                        : "Build a patient intake flow"}
                                </h2>
                                <p className="max-w-3xl text-sm text-muted-foreground">
                                    Keep the form in the same top-to-bottom order patients will complete it. PHI labels are hidden here so you can focus on clarity and flow.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:min-w-72">
                        <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Sections
                            </p>
                            <p className="mt-2 text-2xl font-semibold">{enabledSectionCount}</p>
                            <p className="text-xs text-muted-foreground">Enabled in patient flow</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Items
                            </p>
                            <p className="mt-2 text-2xl font-semibold">{fieldCount}</p>
                            <p className="text-xs text-muted-foreground">Questions and content blocks</p>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader>
                    <CardTitle>Template Details</CardTitle>
                    <CardDescription>
                        Name the form and explain when the clinic should use it.
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
                        <Label htmlFor="template-description">Description</Label>
                        <Textarea
                            id="template-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Used before a first appointment or annual update"
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <CardTitle>Form Flow</CardTitle>
                        <CardDescription>
                            Review the intake in chronological order and adjust each step inline.
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={addSection}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Section
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sections.map((section, sectionIndex) => (
                        <div
                            key={section.id}
                            className="rounded-3xl border border-border/70 bg-muted/20 p-4 shadow-sm"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-sm font-semibold">
                                        {sectionIndex + 1}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={section.enabled ? "default" : "secondary"} className="rounded-full px-3 py-1">
                                                {section.enabled ? "Visible to patients" : "Hidden"}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                                {section.fields.length} items
                                            </Badge>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                            <div className="space-y-2">
                                                <Label htmlFor={`section-title-${section.id}`}>
                                                    Section title
                                                </Label>
                                                <Input
                                                    id={`section-title-${section.id}`}
                                                    value={section.title}
                                                    onChange={(event) =>
                                                        updateSection(section.id, {
                                                            title: event.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`section-description-${section.id}`}>
                                                    Section intro
                                                </Label>
                                                <Textarea
                                                    id={`section-description-${section.id}`}
                                                    value={section.description ?? ""}
                                                    onChange={(event) =>
                                                        updateSection(section.id, {
                                                            description: event.target.value,
                                                        })
                                                    }
                                                    placeholder="Optional context shown before these questions"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 text-sm">
                                        <Switch
                                            checked={section.enabled}
                                            onCheckedChange={(checked) =>
                                                updateSection(section.id, {
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
                                        onClick={() => removeSection(section.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Separator className="my-5" />

                            <div className="space-y-3">
                                {section.fields.map((field, fieldIndex) => (
                                    <div
                                        key={field.id}
                                        className="rounded-2xl border border-border/60 bg-background/90 p-4"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                                            <div className="flex items-center gap-3 xl:w-14 xl:flex-col xl:items-center xl:justify-center">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-xs font-semibold">
                                                    {fieldIndex + 1}
                                                </div>
                                                <Rows3 className="hidden h-4 w-4 text-muted-foreground xl:block" />
                                            </div>

                                            <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_180px_130px_auto]">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`field-label-${field.id}`}>
                                                        Label or content
                                                    </Label>
                                                    <Input
                                                        id={`field-label-${field.id}`}
                                                        value={field.label}
                                                        onChange={(event) =>
                                                            updateField(section.id, field.id, {
                                                                label: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Field type</Label>
                                                    <Select
                                                        value={field.type}
                                                        onValueChange={(value) =>
                                                            updateField(section.id, field.id, {
                                                                type: value as FieldType,
                                                                options: supportsOptions(
                                                                    value as FieldType,
                                                                )
                                                                    ? field.options ?? ["Option 1"]
                                                                    : undefined,
                                                                placeholder: supportsPlaceholder(
                                                                    value as FieldType,
                                                                )
                                                                    ? field.placeholder ?? ""
                                                                    : undefined,
                                                                required: supportsRequired(
                                                                    value as FieldType,
                                                                )
                                                                    ? field.required
                                                                    : false,
                                                            })
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
                                                    <div className="flex h-10 items-center rounded-xl border border-border/60 px-3">
                                                        <Switch
                                                            checked={field.required}
                                                            disabled={!supportsRequired(field.type)}
                                                            onCheckedChange={(checked) =>
                                                                updateField(section.id, field.id, {
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

                                                <div className="flex items-end justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            removeField(section.id, field.id)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                            {supportsPlaceholder(field.type) && (
                                                <div className="space-y-2">
                                                    <Label htmlFor={`field-placeholder-${field.id}`}>
                                                        {field.type === "checkbox"
                                                            ? "Checkbox label"
                                                            : "Placeholder"}
                                                    </Label>
                                                    <Input
                                                        id={`field-placeholder-${field.id}`}
                                                        value={field.placeholder ?? ""}
                                                        onChange={(event) =>
                                                            updateField(section.id, field.id, {
                                                                placeholder: event.target.value,
                                                            })
                                                        }
                                                        placeholder={
                                                            field.type === "checkbox"
                                                                ? "Yes"
                                                                : "Optional helper text"
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {supportsOptions(field.type) && (
                                                <div className="space-y-2">
                                                    <Label htmlFor={`field-options-${field.id}`}>
                                                        Choices
                                                    </Label>
                                                    <Input
                                                        id={`field-options-${field.id}`}
                                                        value={(field.options ?? []).join(", ")}
                                                        onChange={(event) =>
                                                            updateField(section.id, field.id, {
                                                                options: event.target.value
                                                                    .split(",")
                                                                    .map((option) => option.trim())
                                                                    .filter(Boolean),
                                                            })
                                                        }
                                                        placeholder="Yes, No, Not sure"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    onClick={() => addField(section.id)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Field
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader>
                    <CardTitle>Consent</CardTitle>
                    <CardDescription>
                        This text appears at the end of the patient flow before submission.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="consent-version">Consent version</Label>
                        <Input
                            id="consent-version"
                            value={consentVersion}
                            onChange={(event) => setConsentVersion(event.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="consent-text">Consent notice</Label>
                        <Textarea
                            id="consent-text"
                            value={consentText}
                            onChange={(event) => setConsentText(event.target.value)}
                            rows={8}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <div className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
                        <FileText className="h-4 w-4" />
                        <span>
                            {enabledSectionCount} sections live, {fieldCount} total items
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
