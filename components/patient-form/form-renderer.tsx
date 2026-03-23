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
}

interface FormStep {
    id: string;
    title: string;
    description?: string;
    sections: TemplateSectionDoc[];
    fieldIds: string[];
    kind: "section" | "consent";
}

const LONG_FORM_FIELD_THRESHOLD = 10;
const CONSENT_FIELD_ID = "__consent";
const FOLLOW_UP_SUFFIX = "__followUp";

function isInteractiveField(field: TemplateFieldDoc): boolean {
    return true;
}

/** Fields that need full width in the 2-col grid */
function isWideField(field: TemplateFieldDoc): boolean {
    if (field.type === "radio" || field.type === "multiSelect") {
        const options = field.options ?? [];
        return options.length > 4 || options.some((o) => o.length > 20);
    }
    return (
        field.type === "textarea" ||
        field.type === "signature" ||
        field.type === "address"
    );
}

function getFieldRules(
    field: TemplateFieldDoc,
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

export function FormRenderer({
    template,
    token,
    language,
    clientName,
    onSubmitStart,
    preview,
}: FormRendererProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const copy = PATIENT_FORM_COPY[language];
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
                if (field.followUp?.enabled) {
                    values[`${field.id}${FOLLOW_UP_SUFFIX}`] = "";
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
                if (field.followUp?.enabled) {
                    ids.push(`${field.id}${FOLLOW_UP_SUFFIX}`);
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
        if (!wizardMode) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStepIndex, wizardMode]);

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

        // Strip follow-up values where parent doesn't match the trigger
        const formData: FormValues = {};
        const allFields = enabledSections.flatMap((s) => s.fields);
        for (const [key, value] of Object.entries(rawFormData)) {
            if (key.endsWith(FOLLOW_UP_SUFFIX)) {
                const parentId = key.slice(0, -FOLLOW_UP_SUFFIX.length);
                const parentField = allFields.find((f) => f.id === parentId);
                if (
                    parentField?.followUp?.enabled &&
                    matchesFollowUpTrigger(
                        parentField,
                        rawFormData[parentId] ?? "",
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
            // Bypass handleSubmit — validate via trigger() which works
            // reliably on unmounted Controller fields
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

    const renderFollowUp = (field: TemplateFieldDoc) => {
        if (!field.followUp?.enabled) return null;

        const followUpId = `${field.id}${FOLLOW_UP_SUFFIX}`;
        const parentValue = watch(field.id);
        const isVisible = matchesFollowUpTrigger(field, parentValue ?? "");

        if (!isVisible) return null;

        const followUpError = getErrorMessage(errors[followUpId]);

        return (
            <div className="space-y-1.5 sm:col-span-6">
                <Label htmlFor={followUpId} className="text-sm">
                    {field.followUp.label}
                    {field.followUp.required && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </Label>
                <Textarea
                    id={followUpId}
                    rows={2}
                    placeholder={field.followUp.label}
                    {...register(followUpId, {
                        required: field.followUp.required
                            ? copy.requiredField(field.followUp.label)
                            : false,
                    })}
                />
                {followUpError && (
                    <p className="text-sm text-destructive">{followUpError}</p>
                )}
            </div>
        );
    };

    const getFieldSpanClass = (field: TemplateFieldDoc): string => {
        // Explicit width takes priority
        const w = (field as TemplateFieldDoc & { width?: string }).width;
        if (w === "third") return "sm:col-span-2";
        if (w === "full") return "sm:col-span-6";
        if (w === "half") return "sm:col-span-3";
        // No explicit width: auto-detect wide fields (backward compat)
        if (isWideField(field)) return "sm:col-span-6";
        // Default: half (2-per-row, matches old sm:grid-cols-2)
        return "sm:col-span-3";
    };

    const renderField = (field: TemplateFieldDoc) => {
        const errorMessage = getErrorMessage(errors[field.id]);
        const spanClass = getFieldSpanClass(field);

        if (field.type === "signature") {
            return (
                <div key={field.id} className="space-y-1.5 sm:col-span-6">
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

        return (
            <div key={field.id} className={`space-y-1.5 ${spanClass}`}>
                <Label htmlFor={field.id} className="text-sm">
                    {field.label}
                    {field.required && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </Label>

                {field.type === "text" && (
                    <Input
                        id={field.id}
                        placeholder={field.placeholder}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                )}

                {field.type === "email" && (
                    <Input
                        id={field.id}
                        type="email"
                        placeholder={field.placeholder ?? "email@example.com"}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                )}

                {field.type === "phone" && (
                    <Input
                        id={field.id}
                        type="tel"
                        placeholder={field.placeholder ?? "(555) 123-4567"}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                )}

                {field.type === "date" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field, language)}
                        render={({ field: controllerField }) => (
                            <ClientFormDatePicker
                                value={controllerField.value ?? ""}
                                onChange={controllerField.onChange}
                                language={language}
                            />
                        )}
                    />
                )}

                {field.type === "number" && (
                    <Input
                        id={field.id}
                        type="number"
                        placeholder={field.placeholder}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                )}

                {field.type === "textarea" && (
                    <Textarea
                        id={field.id}
                        rows={3}
                        placeholder={field.placeholder}
                        {...register(field.id, getFieldRules(field, language))}
                    />
                )}

                {field.type === "select" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field, language)}
                        render={({ field: controllerField }) => (
                            <Select
                                value={controllerField.value ?? ""}
                                onValueChange={controllerField.onChange}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={copy.selectOption}
                                    />
                                </SelectTrigger>
                                <SelectContent className="force-light">
                                    {(field.options ?? []).map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                )}

                {field.type === "radio" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field, language)}
                        render={({ field: controllerField }) => {
                            const options = field.options ?? [];
                            const useInline =
                                options.length <= 4 &&
                                options.every((o) => o.length <= 20);
                            return (
                                <RadioGroup
                                    value={controllerField.value ?? ""}
                                    onValueChange={controllerField.onChange}
                                    className={
                                        useInline
                                            ? "flex flex-wrap gap-2"
                                            : "gap-2"
                                    }
                                >
                                    {options.map((option) => (
                                        <div
                                            key={option}
                                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-background px-3 py-2"
                                        >
                                            <RadioGroupItem
                                                value={option}
                                                id={`${field.id}-${option}`}
                                            />
                                            <Label
                                                htmlFor={`${field.id}-${option}`}
                                                className="text-sm font-normal"
                                            >
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            );
                        }}
                    />
                )}

                {field.type === "multiSelect" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field, language)}
                        render={({ field: controllerField }) => {
                            const options = field.options ?? [];
                            const selected = parseMultipleChoiceValue(
                                controllerField.value ?? "",
                            );
                            const useInline =
                                options.length <= 4 &&
                                options.every((o) => o.length <= 20);
                            return (
                                <div
                                    className={
                                        useInline
                                            ? "flex flex-wrap gap-2"
                                            : "space-y-2"
                                    }
                                >
                                    {options.map((option) => {
                                        const isChecked =
                                            selected.includes(option);
                                        return (
                                            <div
                                                key={option}
                                                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-background px-3 py-2"
                                            >
                                                <Checkbox
                                                    id={`${field.id}-${option}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) => {
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
                                                    htmlFor={`${field.id}-${option}`}
                                                    className="text-sm font-normal"
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
                )}

                {field.type === "address" && (
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
                )}

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
                    const followUp = renderFollowUp(field);
                    if (followUp) {
                        rendered.push(
                            <React.Fragment key={`${field.id}-followup`}>
                                {followUp}
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
                        ) : preview ? null : (
                            <Card className="rounded-2xl sm:rounded-3xl border-border/70 shadow-sm">
                                <CardHeader>
                                    <CardTitle>{copy.reviewTitle}</CardTitle>
                                    <CardDescription>
                                        {copy.reviewDescription}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <ConsentNotice
                                        consentText={copy.consentNoticeText}
                                        consentVersion="1.0"
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

                    {!preview && (
                        <>
                            <ConsentNotice
                                consentText={copy.consentNoticeText}
                                consentVersion="1.0"
                                language={language}
                                agreed={consentAgreed}
                                onAgreeChange={(agreed) =>
                                    setValue(
                                        CONSENT_FIELD_ID,
                                        agreed ? "true" : "",
                                        {
                                            shouldValidate: true,
                                        },
                                    )
                                }
                            />

                            {getErrorMessage(errors[CONSENT_FIELD_ID]) && (
                                <p className="text-center text-sm text-destructive">
                                    {getErrorMessage(errors[CONSENT_FIELD_ID])}
                                </p>
                            )}

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
