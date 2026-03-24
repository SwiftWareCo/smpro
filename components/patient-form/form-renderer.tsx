"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { Controller, useForm } from "react-hook-form";
import type { FieldErrors, RegisterOptions } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
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
import { Progress } from "@/components/ui/progress";
import { Loader2, LockKeyhole, ChevronRight, Eye } from "lucide-react";
import { ClientFormDatePicker } from "./client-form-date-picker";
import { ConsentNotice } from "./consent-notice";
import { SignaturePad } from "./signature-pad";
import { AddressAutocomplete } from "./address-autocomplete";
import {
    PATIENT_FORM_COPY,
    isRtlLanguage,
    type FormLanguage,
} from "@/lib/patient-form-i18n";
import {
    matchesFollowUpTrigger,
    parseMultipleChoiceValue,
    serializeMultipleChoiceValue,
} from "@/lib/multiple-choice";
import {
    makeFollowUpKey,
    parseFollowUpKey,
} from "@/lib/validation/dental-form";

type TemplateSectionDoc = Doc<"formTemplates">["sections"][number];
type TemplateFieldDoc = TemplateSectionDoc["fields"][number];
type FormValues = Record<string, string>;

interface FormRendererProps {
    template: Doc<"formTemplates">;
    token?: string;
    language: FormLanguage;
    clientName: string;
    onSubmitStart?: () => void;
    preview?: boolean;
    dialogClassName?: string;
    dialogStyle?: React.CSSProperties;
}

interface FormStep {
    id: string;
    title: string;
    description?: string;
    sections: TemplateSectionDoc[];
    fieldIds: string[];
    kind: "section" | "consent";
}

interface ParagraphStyleConfig {
    fontSize?: "sm" | "base" | "lg" | "xl";
    bold?: boolean;
}

const LONG_FORM_FIELD_THRESHOLD = 10;
const CONSENT_FIELD_ID = "__consent";

function isInteractiveField(field: TemplateFieldDoc): boolean {
    return field.type !== "paragraph";
}

function getChoiceGridClass(width?: string): string {
    if (width === "third") return "grid grid-cols-1 gap-2";
    if (width === "full") return "grid grid-cols-2 sm:grid-cols-3 gap-2";
    return "grid grid-cols-2 gap-2";
}

function getFieldRules(
    field: {
        type: string;
        required: boolean;
        label: string;
        options?: string[];
        validation?: {
            min?: number;
            max?: number;
            pattern?: string;
            message?: string;
        };
    },
    language: FormLanguage,
): RegisterOptions<FormValues, string> {
    const copy = PATIENT_FORM_COPY[language];
    const rules: RegisterOptions<FormValues, string> = {};

    if (field.required) {
        rules.required = copy.requiredField(field.label);
    }

    if (field.type === "email") {
        rules.pattern = {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: copy.invalidEmail,
        };
    }

    if (field.type === "number") {
        rules.validate = (value) => {
            if (!value) return true;
            return !Number.isNaN(Number(value)) || copy.invalidNumber;
        };
    }

    if (field.type === "select" || field.type === "radio") {
        rules.validate = (value) => {
            if (!value) {
                return field.required ? copy.requiredField(field.label) : true;
            }
            return (
                (field.options ?? []).includes(value) || copy.invalidSelection
            );
        };
    }

    if (field.type === "multiSelect") {
        rules.validate = (value) => {
            const selected = parseMultipleChoiceValue(value);
            if (selected.length === 0) {
                return field.required ? copy.requiredField(field.label) : true;
            }
            const allowed = field.options ?? [];
            const allValid = selected.every((v) => allowed.includes(v));
            return allValid || copy.invalidSelection;
        };
    }

    // Custom validation rules
    const v = field.validation;
    if (v) {
        if (field.type === "number") {
            const prevValidate =
                typeof rules.validate === "function"
                    ? rules.validate
                    : undefined;
            rules.validate = (value: string, formValues: FormValues) => {
                if (prevValidate) {
                    const prev = prevValidate(value, formValues);
                    if (prev !== true) return prev;
                }
                if (!value) return true;
                const num = Number(value);
                if (v.min != null && num < v.min)
                    return v.message ?? `Must be at least ${v.min}`;
                if (v.max != null && num > v.max)
                    return v.message ?? `Must be at most ${v.max}`;
                return true;
            };
        } else {
            if (v.min != null)
                rules.minLength = {
                    value: v.min,
                    message:
                        v.message ?? `Must be at least ${v.min} characters`,
                };
            if (v.max != null)
                rules.maxLength = {
                    value: v.max,
                    message: v.message ?? `Must be at most ${v.max} characters`,
                };
            if (v.pattern) {
                rules.pattern = {
                    value: new RegExp(v.pattern),
                    message: v.message ?? "Invalid format",
                };
            }
        }
    }

    return rules;
}

function getErrorMessage(error: unknown): string | undefined {
    if (!error || typeof error !== "object" || !("message" in error)) {
        return undefined;
    }
    return typeof error.message === "string" ? error.message : undefined;
}

function getFieldSpanClass(field: {
    width?: string;
    type: string;
    options?: string[];
}): string {
    if (field.type === "address") return "sm:col-span-6";

    const w = field.width;
    if (w === "third") return "sm:col-span-2";
    if (w === "full") return "sm:col-span-6";
    if (w === "half") return "sm:col-span-3";
    // No explicit width: auto-detect wide fields (backward compat)
    if (
        field.type === "textarea" ||
        field.type === "signature" ||
        field.type === "paragraph"
    ) {
        return "sm:col-span-6";
    }
    return "sm:col-span-3";
}

function getParagraphTextClass(paragraphStyle?: ParagraphStyleConfig): string {
    const fontSizeClass =
        paragraphStyle?.fontSize === "sm"
            ? "text-sm"
            : paragraphStyle?.fontSize === "lg"
              ? "text-lg"
              : paragraphStyle?.fontSize === "xl"
                ? "text-xl"
                : "text-base";

    return `${fontSizeClass} ${paragraphStyle?.bold ? "font-semibold" : "font-normal"} text-foreground whitespace-pre-wrap`;
}

export function FormRenderer({
    template,
    token,
    language,
    clientName,
    onSubmitStart,
    preview,
    dialogClassName,
    dialogStyle,
}: FormRendererProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const copy = PATIENT_FORM_COPY[language];
    const consentText = template.consentText?.trim()
        ? template.consentText
        : copy.consentNoticeText;
    const isRtl = isRtlLanguage(language);

    const submitForm = useAction(api.formSubmissionsActions.submit);

    const enabledSections = useMemo(
        () => template.sections.filter((section) => section.enabled),
        [template.sections],
    );

    const interactiveFieldCount = useMemo(
        () =>
            enabledSections.reduce(
                (count, section) =>
                    count + section.fields.filter(isInteractiveField).length,
                0,
            ),
        [enabledSections],
    );

    const wizardMode = interactiveFieldCount >= LONG_FORM_FIELD_THRESHOLD;

    const defaultValues = useMemo<FormValues>(() => {
        const values: FormValues = { [CONSENT_FIELD_ID]: "" };

        for (const section of enabledSections) {
            for (const field of section.fields) {
                if (!isInteractiveField(field)) continue;
                values[field.id] = "";
                if (field.followUps) {
                    for (const fu of field.followUps) {
                        if (fu.type === "paragraph") continue;
                        values[makeFollowUpKey(field.id, fu.id)] = "";
                    }
                }
            }
        }

        return values;
    }, [enabledSections]);

    const {
        control,
        formState: { errors },
        getValues,
        handleSubmit,
        register,
        setError,
        setValue,
        trigger,
        watch,
    } = useForm<FormValues>({
        defaultValues,
        mode: "onBlur",
        reValidateMode: "onChange",
    });

    const steps = useMemo<FormStep[]>(() => {
        const fieldIdsWithFollowUps = (fields: TemplateFieldDoc[]) =>
            fields.filter(isInteractiveField).flatMap((field) => {
                const ids = [field.id];
                if (field.followUps) {
                    for (const fu of field.followUps) {
                        if (fu.type === "paragraph") continue;
                        ids.push(makeFollowUpKey(field.id, fu.id));
                    }
                }
                return ids;
            });

        if (!wizardMode) {
            return [
                {
                    id: "full-form",
                    title: template.name,
                    description: template.description,
                    sections: enabledSections,
                    fieldIds: enabledSections.flatMap((section) =>
                        fieldIdsWithFollowUps(section.fields),
                    ),
                    kind: "section",
                },
            ];
        }

        const sectionSteps = enabledSections.map((section) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            sections: [section],
            fieldIds: fieldIdsWithFollowUps(section.fields),
            kind: "section" as const,
        }));

        return [
            ...sectionSteps,
            {
                id: "consent-step",
                title: copy.reviewTitle,
                description: copy.reviewDescription,
                sections: [],
                fieldIds: [],
                kind: "consent",
            },
        ];
    }, [
        copy.reviewDescription,
        copy.reviewTitle,
        enabledSections,
        template.description,
        template.name,
        wizardMode,
    ]);

    const currentStep = wizardMode ? steps[currentStepIndex] : null;
    const isFinalWizardStep =
        wizardMode && currentStepIndex === steps.length - 1;
    const progressValue = wizardMode
        ? ((currentStepIndex + 1) / steps.length) * 100
        : 100;
    const consentAgreed = watch(CONSENT_FIELD_ID) === "true";

    useEffect(() => {
        if (!wizardMode || preview) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStepIndex, preview, wizardMode]);

    const goToNextStep = async () => {
        if (!wizardMode || !currentStep) return;
        if (currentStep.fieldIds.length === 0) {
            setCurrentStepIndex((index) =>
                Math.min(index + 1, steps.length - 1),
            );
            return;
        }

        const isValid = await trigger(currentStep.fieldIds);
        if (!isValid) {
            if (preview) {
                setCurrentStepIndex((index) =>
                    Math.min(index + 1, steps.length - 1),
                );
                return;
            }
            toast.error(copy.stepIncomplete);
            return;
        }

        setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
    };

    const onSubmit = async (values: FormValues) => {
        if (values[CONSENT_FIELD_ID] !== "true") {
            setError(CONSENT_FIELD_ID, {
                type: "manual",
                message: copy.consentRequired,
            });
            toast.error(copy.consentRequired);
            return;
        }

        const { [CONSENT_FIELD_ID]: _consent, ...rawFormData } = values;

        // Build lookup of all fields
        const allFields = enabledSections.flatMap((s) => s.fields);
        const fieldMap = new Map(allFields.map((f) => [f.id, f]));

        // Strip follow-up values where parent doesn't match the triggers
        const formData: FormValues = {};
        for (const [key, value] of Object.entries(rawFormData)) {
            const parsed = parseFollowUpKey(key);
            if (parsed) {
                const parentField = fieldMap.get(parsed.parentId);
                if (!parentField?.followUps) continue;
                const fu = parentField.followUps.find(
                    (f) => f.id === parsed.followUpId,
                );
                if (!fu) continue;
                if (fu.type === "paragraph") continue;
                const parentValue = rawFormData[parsed.parentId] ?? "";
                if (
                    matchesFollowUpTrigger(
                        parentField,
                        fu.triggers,
                        parentValue,
                    )
                ) {
                    formData[key] = value;
                }
                continue;
            }
            formData[key] = value;
        }

        if (preview || !token) return;
        onSubmitStart?.();
        setSubmitting(true);
        try {
            await submitForm({
                token,
                formData,
                consentGiven: true,
            });
            router.push(
                `/form/${token}/submitted${language === "en" ? "" : `?lang=${language}`}`,
            );
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

    const handleInvalidSubmit = (formErrors: FieldErrors<FormValues>) => {
        const firstErrorFieldId = Object.keys(formErrors)[0];
        const targetFieldId =
            firstErrorFieldId === CONSENT_FIELD_ID
                ? `field-${CONSENT_FIELD_ID}`
                : firstErrorFieldId
                  ? `field-${firstErrorFieldId}`
                  : null;

        if (targetFieldId) {
            document.getElementById(targetFieldId)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }

        toast.error(copy.fixErrors);
    };

    const handleFormSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (wizardMode && !isFinalWizardStep) {
            await goToNextStep();
            return;
        }

        if (wizardMode) {
            const allFieldIds = steps.flatMap((s) => s.fieldIds);
            const isValid = await trigger(allFieldIds);
            if (isValid) {
                await onSubmit(getValues());
            } else {
                const errorStepIndex = steps.findIndex((step) =>
                    step.fieldIds.some((id) => errors[id]),
                );
                if (errorStepIndex !== -1) setCurrentStepIndex(errorStepIndex);
                toast.error(copy.fixErrors);
            }
            return;
        }

        await handleSubmit(onSubmit, handleInvalidSubmit)(event);
    };

    // Shared field input renderer for both main fields and follow-ups
    const renderFieldInput = (
        fieldType: string,
        fieldKey: string,
        fieldConfig: {
            label: string;
            placeholder?: string;
            required: boolean;
            options?: string[];
            validation?: {
                min?: number;
                max?: number;
                pattern?: string;
                message?: string;
            };
            width?: string;
            paragraphStyle?: ParagraphStyleConfig;
        },
    ) => {
        if (fieldType === "paragraph") {
            return (
                <p
                    className={getParagraphTextClass(
                        fieldConfig.paragraphStyle,
                    )}
                >
                    {fieldConfig.label}
                </p>
            );
        }

        if (fieldType === "text") {
            return (
                <Input
                    id={fieldKey}
                    placeholder={fieldConfig.placeholder}
                    {...register(
                        fieldKey,
                        getFieldRules(
                            { ...fieldConfig, type: fieldType },
                            language,
                        ),
                    )}
                />
            );
        }

        if (fieldType === "textarea") {
            return (
                <Textarea
                    id={fieldKey}
                    rows={3}
                    placeholder={fieldConfig.placeholder}
                    {...register(
                        fieldKey,
                        getFieldRules(
                            { ...fieldConfig, type: fieldType },
                            language,
                        ),
                    )}
                />
            );
        }

        if (fieldType === "number") {
            return (
                <Input
                    id={fieldKey}
                    type="number"
                    placeholder={fieldConfig.placeholder}
                    {...register(
                        fieldKey,
                        getFieldRules(
                            { ...fieldConfig, type: fieldType },
                            language,
                        ),
                    )}
                />
            );
        }

        if (fieldType === "date") {
            return (
                <Controller
                    name={fieldKey}
                    control={control}
                    rules={getFieldRules(
                        { ...fieldConfig, type: fieldType },
                        language,
                    )}
                    render={({ field: controllerField }) => (
                        <ClientFormDatePicker
                            value={controllerField.value ?? ""}
                            onChange={controllerField.onChange}
                            language={language}
                        />
                    )}
                />
            );
        }

        if (fieldType === "select") {
            return (
                <Controller
                    name={fieldKey}
                    control={control}
                    rules={getFieldRules(
                        { ...fieldConfig, type: fieldType },
                        language,
                    )}
                    render={({ field: controllerField }) => (
                        <Select
                            value={controllerField.value ?? ""}
                            onValueChange={controllerField.onChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={copy.selectOption} />
                            </SelectTrigger>
                            <SelectContent className="force-light">
                                {(fieldConfig.options ?? []).map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            );
        }

        if (fieldType === "radio") {
            return (
                <Controller
                    name={fieldKey}
                    control={control}
                    rules={getFieldRules(
                        { ...fieldConfig, type: fieldType },
                        language,
                    )}
                    render={({ field: controllerField }) => {
                        const options = fieldConfig.options ?? [];
                        const gridClass = getChoiceGridClass(fieldConfig.width);
                        return (
                            <RadioGroup
                                value={controllerField.value ?? ""}
                                onValueChange={controllerField.onChange}
                                className={gridClass}
                            >
                                {options.map((option) => (
                                    <div
                                        key={option}
                                        className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-300 bg-background px-3 py-2"
                                    >
                                        <RadioGroupItem
                                            value={option}
                                            id={`${fieldKey}-${option}`}
                                            className="mt-0.5"
                                        />
                                        <Label
                                            htmlFor={`${fieldKey}-${option}`}
                                            title={option}
                                            className="min-w-0 flex-1 truncate text-sm font-normal"
                                        >
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        );
                    }}
                />
            );
        }

        if (fieldType === "multiSelect") {
            return (
                <Controller
                    name={fieldKey}
                    control={control}
                    rules={getFieldRules(
                        { ...fieldConfig, type: fieldType },
                        language,
                    )}
                    render={({ field: controllerField }) => {
                        const options = fieldConfig.options ?? [];
                        const selected = parseMultipleChoiceValue(
                            controllerField.value ?? "",
                        );
                        const gridClass = getChoiceGridClass(fieldConfig.width);
                        return (
                            <div className={gridClass}>
                                {options.map((option) => {
                                    const isChecked = selected.includes(option);
                                    return (
                                        <div
                                            key={option}
                                            className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-300 bg-background px-3 py-2"
                                        >
                                            <Checkbox
                                                id={`${fieldKey}-${option}`}
                                                checked={isChecked}
                                                className="mt-0.5"
                                                onCheckedChange={(checked) => {
                                                    const next =
                                                        checked === true
                                                            ? [
                                                                  ...selected,
                                                                  option,
                                                              ]
                                                            : selected.filter(
                                                                  (v) =>
                                                                      v !==
                                                                      option,
                                                              );
                                                    controllerField.onChange(
                                                        serializeMultipleChoiceValue(
                                                            next,
                                                        ),
                                                    );
                                                }}
                                            />
                                            <Label
                                                htmlFor={`${fieldKey}-${option}`}
                                                title={option}
                                                className="min-w-0 flex-1 truncate text-sm font-normal"
                                            >
                                                {option}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }}
                />
            );
        }

        return null;
    };

    const renderFollowUps = (field: TemplateFieldDoc) => {
        if (!field.followUps || field.followUps.length === 0) return null;

        const parentValue = watch(field.id);

        return field.followUps
            .filter((fu) =>
                matchesFollowUpTrigger(field, fu.triggers, parentValue ?? ""),
            )
            .map((fu) => {
                const fuKey = makeFollowUpKey(field.id, fu.id);
                const spanClass = getFieldSpanClass(fu);

                if (fu.type === "paragraph") {
                    return (
                        <div key={fuKey} className={`${spanClass}`}>
                            <p
                                className={getParagraphTextClass(
                                    fu.paragraphStyle,
                                )}
                            >
                                {fu.label}
                            </p>
                        </div>
                    );
                }

                const fuError = getErrorMessage(errors[fuKey]);
                return (
                    <div key={fuKey} className={`space-y-1.5 ${spanClass}`}>
                        <Label htmlFor={fuKey} className="text-sm">
                            {fu.label}
                            {fu.required && (
                                <span className="ml-1 text-destructive">*</span>
                            )}
                        </Label>
                        {renderFieldInput(fu.type, fuKey, {
                            label: fu.label,
                            placeholder: fu.placeholder,
                            required: fu.required,
                            options: fu.options,
                            width: fu.width,
                            paragraphStyle: fu.paragraphStyle,
                        })}
                        {fuError && (
                            <p className="text-sm text-destructive">
                                {fuError}
                            </p>
                        )}
                    </div>
                );
            });
    };

    const renderField = (field: TemplateFieldDoc) => {
        if (field.type === "paragraph") {
            return (
                <div key={field.id} className="sm:col-span-6">
                    <p className={getParagraphTextClass(field.paragraphStyle)}>
                        {field.label}
                    </p>
                </div>
            );
        }

        const errorMessage = getErrorMessage(errors[field.id]);
        const spanClass = getFieldSpanClass(field);

        if (field.type === "signature") {
            return (
                <div key={field.id} className={`space-y-1.5 ${spanClass}`}>
                    <Controller
                        name={field.id}
                        control={control}
                        rules={{
                            validate: (value) =>
                                !field.required || value
                                    ? true
                                    : copy.requiredField(field.label),
                        }}
                        render={({ field: controllerField }) => (
                            <SignaturePad
                                label={field.label}
                                required={field.required}
                                value={controllerField.value ?? ""}
                                onChange={controllerField.onChange}
                                dialogClassName={dialogClassName}
                                dialogStyle={dialogStyle}
                            />
                        )}
                    />
                    {errorMessage && (
                        <p className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}
                </div>
            );
        }

        if (field.type === "address") {
            return (
                <div key={field.id} className={`space-y-1.5 ${spanClass}`}>
                    <Label htmlFor={field.id} className="text-sm">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-destructive">*</span>
                        )}
                    </Label>
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field, language)}
                        render={({ field: controllerField }) => (
                            <AddressAutocomplete
                                value={controllerField.value ?? ""}
                                onChange={controllerField.onChange}
                                language={language}
                                placeholder={copy.addressPlaceholder}
                            />
                        )}
                    />
                    {errorMessage && (
                        <p className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}
                </div>
            );
        }

        if (field.type === "email") {
            return (
                <div key={field.id} className={`space-y-1.5 ${spanClass}`}>
                    <Label htmlFor={field.id} className="text-sm">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-destructive">*</span>
                        )}
                    </Label>
                    <Input
                        id={field.id}
                        type="email"
                        placeholder={field.placeholder ?? "email@example.com"}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                    {errorMessage && (
                        <p className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}
                </div>
            );
        }

        if (field.type === "phone") {
            return (
                <div key={field.id} className={`space-y-1.5 ${spanClass}`}>
                    <Label htmlFor={field.id} className="text-sm">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-destructive">*</span>
                        )}
                    </Label>
                    <Input
                        id={field.id}
                        type="tel"
                        placeholder={field.placeholder ?? "(555) 123-4567"}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                    {errorMessage && (
                        <p className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    )}
                </div>
            );
        }

        // All remaining types: text, textarea, number, date, select, radio, multiSelect
        return (
            <div key={field.id} className={`space-y-1.5 ${spanClass}`}>
                <Label htmlFor={field.id} className="text-sm">
                    {field.label}
                    {field.required && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </Label>
                {renderFieldInput(field.type, field.id, {
                    label: field.label,
                    placeholder: field.placeholder,
                    required: field.required,
                    options: field.options,
                    validation: field.validation,
                    width: field.width,
                    paragraphStyle: field.paragraphStyle,
                })}
                {errorMessage && (
                    <p className="text-sm text-destructive">{errorMessage}</p>
                )}
            </div>
        );
    };

    const renderSectionCard = (section: TemplateSectionDoc) => (
        <Card
            key={section.id}
            className="rounded-2xl sm:rounded-3xl border-border/70 shadow-sm"
        >
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-xs font-semibold">
                        {enabledSections.findIndex(
                            (item) => item.id === section.id,
                        ) + 1}
                    </div>
                    <div>
                        <CardTitle className="text-base tracking-tight">
                            {section.title}
                        </CardTitle>
                        {section.description && (
                            <CardDescription className="mt-0.5 text-sm">
                                {section.description}
                            </CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-6">
                {section.fields.flatMap((field) => {
                    const rendered = [renderField(field)];
                    const followUps = renderFollowUps(field);
                    if (followUps) {
                        rendered.push(
                            <React.Fragment key={`${field.id}-followups`}>
                                {followUps}
                            </React.Fragment>,
                        );
                    }
                    return rendered;
                })}
            </CardContent>
        </Card>
    );

    const Wrapper = preview ? "div" : "form";
    const wrapperProps = preview
        ? { className: "space-y-6" }
        : { onSubmit: handleFormSubmit, className: "space-y-6" };

    return (
        <Wrapper {...(wrapperProps as React.HTMLAttributes<HTMLElement>)}>
            {preview && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                    <Eye className="h-4 w-4 shrink-0" />
                    Preview — this is what patients will see
                </div>
            )}
            <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                            {clientName}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {template.name}
                        </p>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        {copy.encryptedSubmission}
                    </div>
                </div>

                {wizardMode && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                {copy.stepOf(
                                    currentStepIndex + 1,
                                    steps.length,
                                )}
                            </span>
                            <span>
                                {copy.percentComplete(
                                    Math.round(progressValue),
                                )}
                            </span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                    </div>
                )}
            </div>

            {wizardMode && currentStep ? (
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                    {/* Mobile step indicator */}
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
                        {steps.map((step, index) => {
                            const isComplete = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    disabled={
                                        !preview && index > currentStepIndex
                                    }
                                    onClick={() => {
                                        if (preview || index < currentStepIndex)
                                            setCurrentStepIndex(index);
                                    }}
                                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                                        isCurrent
                                            ? "border-primary/40 bg-primary/10 text-primary"
                                            : isComplete
                                              ? "border-border/60 bg-muted/30 text-foreground"
                                              : "border-border/60 bg-background text-muted-foreground"
                                    }`}
                                >
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                            isCurrent
                                                ? "bg-primary text-primary-foreground"
                                                : isComplete
                                                  ? "bg-foreground text-background"
                                                  : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className="truncate max-w-[100px]">
                                        {step.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop sidebar */}
                    <Card className="hidden lg:block rounded-2xl sm:rounded-3xl border-border/70 shadow-sm lg:sticky lg:top-6">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {copy.wizardTitle}
                            </CardTitle>
                            <CardDescription>
                                {copy.wizardDescription}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {steps.map((step, index) => {
                                const isComplete = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div
                                        key={step.id}
                                        role={preview ? "button" : undefined}
                                        tabIndex={preview ? 0 : undefined}
                                        onClick={
                                            preview
                                                ? () =>
                                                      setCurrentStepIndex(index)
                                                : undefined
                                        }
                                        className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                                            preview ? "cursor-pointer" : ""
                                        } ${
                                            isCurrent
                                                ? "border-primary/40 bg-primary/5"
                                                : isComplete
                                                  ? "border-border/60 bg-muted/20"
                                                  : "border-border/60 bg-background"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {step.title}
                                                </p>
                                                {step.description && (
                                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div
                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                    isCurrent
                                                        ? "bg-primary text-primary-foreground"
                                                        : isComplete
                                                          ? "bg-foreground text-background"
                                                          : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {index + 1}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        {currentStep.kind === "section" ? (
                            currentStep.sections.map(renderSectionCard)
                        ) : (
                            <Card className="rounded-2xl sm:rounded-3xl border-border/70 shadow-sm">
                                <CardHeader>
                                    <CardTitle>{copy.reviewTitle}</CardTitle>
                                    <CardDescription>
                                        {copy.reviewDescription}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <ConsentNotice
                                        consentText={consentText}
                                        language={language}
                                        agreed={consentAgreed}
                                        onAgreeChange={(agreed) =>
                                            setValue(
                                                CONSENT_FIELD_ID,
                                                agreed ? "true" : "",
                                                { shouldValidate: true },
                                            )
                                        }
                                    />
                                    {getErrorMessage(
                                        errors[CONSENT_FIELD_ID],
                                    ) && (
                                        <p className="text-sm text-destructive">
                                            {getErrorMessage(
                                                errors[CONSENT_FIELD_ID],
                                            )}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={currentStepIndex === 0 || submitting}
                                onClick={() =>
                                    setCurrentStepIndex((index) =>
                                        Math.max(index - 1, 0),
                                    )
                                }
                            >
                                {copy.back}
                            </Button>

                            {preview &&
                            isFinalWizardStep ? null : isFinalWizardStep ? (
                                <Button
                                    type="submit"
                                    disabled={submitting || !consentAgreed}
                                    className="sm:min-w-44"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {copy.submitting}
                                        </>
                                    ) : (
                                        copy.submit
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={goToNextStep}
                                    className="sm:min-w-44"
                                >
                                    {copy.next}
                                    <ChevronRight
                                        className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`}
                                    />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {enabledSections.map(renderSectionCard)}

                    <ConsentNotice
                        consentText={consentText}
                        language={language}
                        agreed={consentAgreed}
                        onAgreeChange={(agreed) =>
                            setValue(CONSENT_FIELD_ID, agreed ? "true" : "", {
                                shouldValidate: true,
                            })
                        }
                    />

                    {getErrorMessage(errors[CONSENT_FIELD_ID]) && (
                        <p className="text-center text-sm text-destructive">
                            {getErrorMessage(errors[CONSENT_FIELD_ID])}
                        </p>
                    )}

                    {!preview && (
                        <>
                            <Button
                                type="submit"
                                disabled={submitting || !consentAgreed}
                                className="h-12 w-full text-base"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {copy.submitting}
                                    </>
                                ) : (
                                    copy.submit
                                )}
                            </Button>
                        </>
                    )}
                </>
            )}

            <p className="text-center text-xs text-muted-foreground">
                {copy.encryptedFooter}
            </p>
        </Wrapper>
    );
}
