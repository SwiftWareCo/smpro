"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Loader2, LockKeyhole, ChevronRight } from "lucide-react";
import { ClientFormDatePicker } from "./client-form-date-picker";
import { ConsentNotice } from "./consent-notice";
import { SignaturePad } from "./signature-pad";
import {
    PATIENT_FORM_COPY,
    isRtlLanguage,
    type FormLanguage,
} from "@/lib/patient-form-i18n";

type TemplateSectionDoc = Doc<"formTemplates">["sections"][number];
type TemplateFieldDoc = TemplateSectionDoc["fields"][number];
type FormValues = Record<string, string>;

interface FormRendererProps {
    template: Doc<"formTemplates">;
    token: string;
    language: FormLanguage;
    clientName: string;
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

function isInteractiveField(field: TemplateFieldDoc): boolean {
    return true;
}

/** Fields that need full width in the 2-col grid */
function isWideField(field: TemplateFieldDoc): boolean {
    if (field.type === "radio") {
        const options = field.options ?? [];
        return options.length > 4 || options.some((o) => o.length > 20);
    }
    return field.type === "textarea" || field.type === "signature";
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
        if (!wizardMode) {
            return [
                {
                    id: "full-form",
                    title: template.name,
                    description: template.description,
                    sections: enabledSections,
                    fieldIds: enabledSections.flatMap((section) =>
                        section.fields
                            .filter(isInteractiveField)
                            .map((field) => field.id),
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
            fieldIds: section.fields
                .filter(isInteractiveField)
                .map((field) => field.id),
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

        const { [CONSENT_FIELD_ID]: _consent, ...formData } = values;

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

    const renderField = (field: TemplateFieldDoc) => {
        const errorMessage = getErrorMessage(errors[field.id]);
        const wide = isWideField(field);
        const spanClass = wide ? "sm:col-span-2" : "";

        if (field.type === "signature") {
            return (
                <div key={field.id} className="space-y-1.5 sm:col-span-2">
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
                                <SelectContent>
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
                                            className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
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

                {field.type === "checkbox" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field, language)}
                        render={({ field: controllerField }) => (
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                                <Checkbox
                                    id={field.id}
                                    checked={controllerField.value === "true"}
                                    onCheckedChange={(checked) =>
                                        controllerField.onChange(
                                            checked === true ? "true" : "",
                                        )
                                    }
                                />
                                <Label
                                    htmlFor={field.id}
                                    className="text-sm font-normal"
                                >
                                    {field.placeholder ?? "Yes"}
                                </Label>
                            </div>
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
            <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {section.fields.map(renderField)}
            </CardContent>
        </Card>
    );

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
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
                                    disabled={index > currentStepIndex}
                                    onClick={() => {
                                        if (index < currentStepIndex)
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
                                        className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
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
                                        consentText={template.consentText}
                                        consentVersion={template.consentVersion}
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

                            {isFinalWizardStep ? (
                                <Button
                                    type="submit"
                                    disabled={submitting}
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
                        consentText={template.consentText}
                        consentVersion={template.consentVersion}
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

                    <Button
                        type="submit"
                        disabled={submitting}
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

            <p className="text-center text-xs text-muted-foreground">
                {copy.encryptedFooter}
            </p>
        </form>
    );
}
