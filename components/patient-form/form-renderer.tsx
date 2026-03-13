"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ConsentNotice } from "./consent-notice";
import { SignaturePad } from "./signature-pad";

interface FormRendererProps {
    template: Doc<"formTemplates">;
    token: string;
}

export function FormRenderer({ template, token }: FormRendererProps) {
    const router = useRouter();
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [consentAgreed, setConsentAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submitForm = useAction(api.formSubmissionsActions.submit);

    const enabledSections = template.sections.filter((s) => s.enabled);

    const updateValue = (fieldId: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [fieldId]: value }));
        // Clear error when user starts typing
        if (errors[fieldId]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const section of enabledSections) {
            for (const field of section.fields) {
                if (field.type === "heading" || field.type === "paragraph") {
                    continue;
                }

                const value = formValues[field.id] ?? "";

                if (field.required && !value.trim()) {
                    newErrors[field.id] = `${field.label} is required`;
                }

                if (
                    field.type === "email" &&
                    value &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ) {
                    newErrors[field.id] = "Please enter a valid email";
                }
            }
        }

        if (!consentAgreed) {
            newErrors["_consent"] = "You must agree to the consent notice";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        setSubmitting(true);
        try {
            await submitForm({
                token,
                formData: formValues,
                consentGiven: true,
            });

            router.push(`/form/${token}/submitted`);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to submit form. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (
        field: Doc<"formTemplates">["sections"][0]["fields"][0],
    ) => {
        const value = formValues[field.id] ?? "";
        const error = errors[field.id];

        if (field.type === "heading") {
            return (
                <h3 key={field.id} className="text-lg font-semibold pt-2">
                    {field.label}
                </h3>
            );
        }

        if (field.type === "paragraph") {
            return (
                <p key={field.id} className="text-sm text-muted-foreground">
                    {field.label}
                </p>
            );
        }

        if (field.type === "signature") {
            return (
                <div key={field.id}>
                    <SignaturePad
                        label={field.label}
                        required={field.required}
                        value={value}
                        onChange={(dataUrl) => updateValue(field.id, dataUrl)}
                    />
                    {error && (
                        <p className="text-sm text-destructive mt-1">{error}</p>
                    )}
                </div>
            );
        }

        return (
            <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && (
                        <span className="text-destructive ml-1">*</span>
                    )}
                </Label>

                {field.type === "text" && (
                    <Input
                        id={field.id}
                        value={value}
                        onChange={(e) => updateValue(field.id, e.target.value)}
                        placeholder={field.placeholder}
                    />
                )}

                {field.type === "email" && (
                    <Input
                        id={field.id}
                        type="email"
                        value={value}
                        onChange={(e) => updateValue(field.id, e.target.value)}
                        placeholder={field.placeholder ?? "email@example.com"}
                    />
                )}

                {field.type === "phone" && (
                    <Input
                        id={field.id}
                        type="tel"
                        value={value}
                        onChange={(e) => updateValue(field.id, e.target.value)}
                        placeholder={field.placeholder ?? "(604) 555-0123"}
                    />
                )}

                {field.type === "date" && (
                    <Input
                        id={field.id}
                        type="date"
                        value={value}
                        onChange={(e) => updateValue(field.id, e.target.value)}
                    />
                )}

                {field.type === "number" && (
                    <Input
                        id={field.id}
                        type="number"
                        value={value}
                        onChange={(e) => updateValue(field.id, e.target.value)}
                        placeholder={field.placeholder}
                    />
                )}

                {field.type === "textarea" && (
                    <Textarea
                        id={field.id}
                        value={value}
                        onChange={(e) => updateValue(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                    />
                )}

                {field.type === "select" && (
                    <Select
                        value={value}
                        onValueChange={(v) => updateValue(field.id, v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {(field.options ?? []).map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {field.type === "radio" && (
                    <RadioGroup
                        value={value}
                        onValueChange={(v) => updateValue(field.id, v)}
                    >
                        {(field.options ?? []).map((option) => (
                            <div
                                key={option}
                                className="flex items-center space-x-2"
                            >
                                <RadioGroupItem
                                    value={option}
                                    id={`${field.id}-${option}`}
                                />
                                <Label htmlFor={`${field.id}-${option}`}>
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}

                {field.type === "checkbox" && (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={field.id}
                            checked={value === "true"}
                            onCheckedChange={(checked) =>
                                updateValue(field.id, String(checked === true))
                            }
                        />
                        <Label htmlFor={field.id} className="font-normal">
                            {field.placeholder ?? "Yes"}
                        </Label>
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {enabledSections.map((section) => (
                <Card key={section.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {section.title}
                        </CardTitle>
                        {section.description && (
                            <p className="text-sm text-muted-foreground">
                                {section.description}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {section.fields.map(renderField)}
                    </CardContent>
                </Card>
            ))}

            <ConsentNotice
                consentText={template.consentText}
                consentVersion={template.consentVersion}
                agreed={consentAgreed}
                onAgreeChange={setConsentAgreed}
            />

            {errors["_consent"] && (
                <p className="text-sm text-destructive text-center">
                    {errors["_consent"]}
                </p>
            )}

            <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base"
            >
                {submitting ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    "Submit Form"
                )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                Your information is encrypted and transmitted securely.
            </p>
        </form>
    );
}
