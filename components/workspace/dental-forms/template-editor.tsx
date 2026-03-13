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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Loader2,
    Plus,
    Trash2,
    GripVertical,
    Shield,
} from "lucide-react";
import type { TemplateSection, TemplateField, FieldType } from "@/lib/validation/dental-form";
import {
    DEFAULT_PIPA_CONSENT_TEXT,
    DEFAULT_CONSENT_VERSION,
} from "@/lib/validation/consent";

interface TemplateEditorProps {
    clientId: Id<"clients">;
    template?: Doc<"formTemplates"> | null;
    onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Text Area" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Radio" },
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
            { id: "first-name", type: "text", label: "First Name", required: true, isPhi: true },
            { id: "last-name", type: "text", label: "Last Name", required: true, isPhi: true },
            { id: "date-of-birth", type: "date", label: "Date of Birth", required: true, isPhi: true },
            { id: "email", type: "email", label: "Email Address", required: true, isPhi: true },
            { id: "phone", type: "phone", label: "Phone Number", required: true, isPhi: true },
            { id: "address", type: "textarea", label: "Address", required: false, isPhi: true },
        ],
    },
    {
        id: "emergency-contact",
        title: "Emergency Contact",
        enabled: true,
        fields: [
            { id: "emergency-name", type: "text", label: "Emergency Contact Name", required: true, isPhi: true },
            { id: "emergency-phone", type: "phone", label: "Emergency Contact Phone", required: true, isPhi: true },
            { id: "emergency-relationship", type: "text", label: "Relationship", required: true, isPhi: false },
        ],
    },
    {
        id: "medical-history",
        title: "Medical History",
        description: "Current health conditions and medications",
        enabled: true,
        fields: [
            { id: "physician-name", type: "text", label: "Family Physician Name", required: false, isPhi: true },
            { id: "physician-phone", type: "phone", label: "Physician Phone", required: false, isPhi: true },
            { id: "current-medications", type: "textarea", label: "Current Medications", placeholder: "List all current medications...", required: false, isPhi: true },
            { id: "allergies", type: "textarea", label: "Allergies", placeholder: "List any known allergies...", required: false, isPhi: true },
            { id: "medical-conditions", type: "textarea", label: "Medical Conditions", placeholder: "List any current or past medical conditions...", required: false, isPhi: true },
            { id: "pregnant", type: "radio", label: "Are you currently pregnant?", required: false, options: ["Yes", "No", "N/A"], isPhi: true },
        ],
    },
    {
        id: "dental-history",
        title: "Dental History",
        enabled: true,
        fields: [
            { id: "last-dental-visit", type: "date", label: "Date of Last Dental Visit", required: false, isPhi: true },
            { id: "previous-dentist", type: "text", label: "Previous Dentist Name", required: false, isPhi: true },
            { id: "reason-for-visit", type: "select", label: "Reason for Visit", required: true, options: ["Regular Check-up", "Dental Pain", "Cosmetic Concern", "Emergency", "Second Opinion", "Other"], isPhi: false },
            { id: "dental-concerns", type: "textarea", label: "Dental Concerns or Symptoms", placeholder: "Describe any current dental concerns...", required: false, isPhi: true },
            { id: "brushing-frequency", type: "select", label: "How often do you brush?", required: false, options: ["Twice daily", "Once daily", "Less than daily"], isPhi: false },
            { id: "flossing-frequency", type: "select", label: "How often do you floss?", required: false, options: ["Daily", "A few times a week", "Rarely", "Never"], isPhi: false },
        ],
    },
    {
        id: "insurance",
        title: "Insurance Information",
        enabled: true,
        fields: [
            { id: "has-insurance", type: "radio", label: "Do you have dental insurance?", required: true, options: ["Yes", "No"], isPhi: false },
            { id: "insurance-provider", type: "text", label: "Insurance Provider", required: false, isPhi: true },
            { id: "policy-number", type: "text", label: "Policy Number", required: false, isPhi: true },
            { id: "group-number", type: "text", label: "Group Number", required: false, isPhi: true },
            { id: "subscriber-name", type: "text", label: "Subscriber Name (if different)", required: false, isPhi: true },
        ],
    },
    {
        id: "signature",
        title: "Patient Signature",
        enabled: true,
        fields: [
            { id: "patient-signature", type: "signature", label: "Patient Signature", required: true, isPhi: true },
            { id: "signature-date", type: "date", label: "Date", required: true, isPhi: false },
        ],
    },
];

function generateId(): string {
    return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(),
    );

    const createTemplate = useMutation(api.formTemplates.create);
    const updateTemplate = useMutation(api.formTemplates.update);

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const updateSectionEnabled = (sectionId: string, enabled: boolean) => {
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, enabled } : s)),
        );
    };

    const updateSectionTitle = (sectionId: string, title: string) => {
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, title } : s)),
        );
    };

    const addField = (sectionId: string) => {
        const newField: TemplateField = {
            id: generateId(),
            type: "text",
            label: "New Field",
            required: false,
            isPhi: false,
        };
        setSections((prev) =>
            prev.map((s) =>
                s.id === sectionId
                    ? { ...s, fields: [...s.fields, newField] }
                    : s,
            ),
        );
    };

    const updateField = (
        sectionId: string,
        fieldId: string,
        updates: Partial<TemplateField>,
    ) => {
        setSections((prev) =>
            prev.map((s) =>
                s.id === sectionId
                    ? {
                          ...s,
                          fields: s.fields.map((f) =>
                              f.id === fieldId ? { ...f, ...updates } : f,
                          ),
                      }
                    : s,
            ),
        );
    };

    const removeField = (sectionId: string, fieldId: string) => {
        setSections((prev) =>
            prev.map((s) =>
                s.id === sectionId
                    ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
                    : s,
            ),
        );
    };

    const addSection = () => {
        const newSection: TemplateSection = {
            id: generateId(),
            title: "New Section",
            enabled: true,
            fields: [],
        };
        setSections((prev) => [...prev, newSection]);
        setExpandedSections((prev) => new Set(prev).add(newSection.id));
    };

    const removeSection = (sectionId: string) => {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
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

        const enabledSections = sections.filter((s) => s.enabled);
        if (enabledSections.length === 0) {
            toast.error("At least one section must be enabled");
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h3 className="text-lg font-medium">
                        {isEditing ? "Edit Template" : "Create Template"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isEditing
                            ? "Modify the form template"
                            : "Start with the pre-built dental intake template and customize sections"}
                    </p>
                </div>
            </div>

            {/* Template Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Name</Label>
                        <Input
                            id="template-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Form template name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template-description">
                            Description
                        </Label>
                        <Textarea
                            id="template-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this form"
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sections */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Form Sections
                            </CardTitle>
                            <CardDescription>
                                Toggle sections on/off and customize fields
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={addSection}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Section
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sections.map((section) => (
                        <Collapsible
                            key={section.id}
                            open={expandedSections.has(section.id)}
                            onOpenChange={() => toggleSection(section.id)}
                        >
                            <div className="border rounded-lg">
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <Switch
                                            checked={section.enabled}
                                            onCheckedChange={(checked) =>
                                                updateSectionEnabled(
                                                    section.id,
                                                    checked,
                                                )
                                            }
                                        />
                                        <CollapsibleTrigger asChild>
                                            <button className="flex items-center gap-2 text-sm font-medium hover:underline">
                                                {expandedSections.has(
                                                    section.id,
                                                ) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                                {section.title}
                                            </button>
                                        </CollapsibleTrigger>
                                        <span className="text-xs text-muted-foreground">
                                            ({section.fields.length} fields)
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                            removeSection(section.id)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <CollapsibleContent>
                                    <Separator />
                                    <div className="p-3 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Section Title</Label>
                                            <Input
                                                value={section.title}
                                                onChange={(e) =>
                                                    updateSectionTitle(
                                                        section.id,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        {/* Fields */}
                                        <div className="space-y-3">
                                            {section.fields.map((field) => (
                                                <div
                                                    key={field.id}
                                                    className="border rounded p-3 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                                                            {field.isPhi && (
                                                                <Shield className="h-3 w-3 text-amber-500" />
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                removeField(
                                                                    section.id,
                                                                    field.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">
                                                                Label
                                                            </Label>
                                                            <Input
                                                                className="h-8 text-sm"
                                                                value={
                                                                    field.label
                                                                }
                                                                onChange={(e) =>
                                                                    updateField(
                                                                        section.id,
                                                                        field.id,
                                                                        {
                                                                            label: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">
                                                                Type
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    field.type
                                                                }
                                                                onValueChange={(
                                                                    v,
                                                                ) =>
                                                                    updateField(
                                                                        section.id,
                                                                        field.id,
                                                                        {
                                                                            type: v as FieldType,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 text-sm">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {FIELD_TYPES.map(
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
                                                    </div>
                                                    {(field.type === "select" ||
                                                        field.type ===
                                                            "radio") && (
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">
                                                                Options
                                                                (comma-separated)
                                                            </Label>
                                                            <Input
                                                                className="h-8 text-sm"
                                                                value={(
                                                                    field.options ??
                                                                    []
                                                                ).join(", ")}
                                                                onChange={(e) =>
                                                                    updateField(
                                                                        section.id,
                                                                        field.id,
                                                                        {
                                                                            options:
                                                                                e.target.value
                                                                                    .split(
                                                                                        ",",
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            o,
                                                                                        ) =>
                                                                                            o.trim(),
                                                                                    )
                                                                                    .filter(
                                                                                        Boolean,
                                                                                    ),
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Option 1, Option 2, Option 3"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={
                                                                    field.required
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    updateField(
                                                                        section.id,
                                                                        field.id,
                                                                        {
                                                                            required:
                                                                                checked,
                                                                        },
                                                                    )
                                                                }
                                                            />
                                                            <Label className="text-xs">
                                                                Required
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={
                                                                    field.isPhi
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    updateField(
                                                                        section.id,
                                                                        field.id,
                                                                        {
                                                                            isPhi: checked,
                                                                        },
                                                                    )
                                                                }
                                                            />
                                                            <Label className="text-xs flex items-center gap-1">
                                                                <Shield className="h-3 w-3 text-amber-500" />
                                                                PHI
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() =>
                                                    addField(section.id)
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Field
                                            </Button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}
                </CardContent>
            </Card>

            {/* Consent Text */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        PIPA Consent Text
                    </CardTitle>
                    <CardDescription>
                        This consent text will be shown to patients before
                        submission. Required for BC PIPA compliance.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="consent-version">
                            Consent Version
                        </Label>
                        <Input
                            id="consent-version"
                            value={consentVersion}
                            onChange={(e) => setConsentVersion(e.target.value)}
                            placeholder="e.g., 1.0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="consent-text">Consent Text</Label>
                        <Textarea
                            id="consent-text"
                            value={consentText}
                            onChange={(e) => setConsentText(e.target.value)}
                            rows={12}
                            className="font-mono text-xs"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 sticky bottom-0 bg-background py-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : isEditing ? (
                        "Update Template"
                    ) : (
                        "Create Template"
                    )}
                </Button>
            </div>
        </div>
    );
}
