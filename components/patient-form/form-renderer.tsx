"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { Controller, useForm } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";
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
import { ConsentNotice } from "./consent-notice";
import { SignaturePad } from "./signature-pad";

type TemplateSectionDoc = Doc<"formTemplates">["sections"][number];
type TemplateFieldDoc = TemplateSectionDoc["fields"][number];
type FormValues = Record<string, string>;

interface FormRendererProps {
    template: Doc<"formTemplates">;
    token: string;
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
    return field.type !== "heading" && field.type !== "paragraph";
}

function getFieldRules(
    field: TemplateFieldDoc,
): RegisterOptions<FormValues, string> {
    const rules: RegisterOptions<FormValues, string> = {};

    if (field.required) {
        rules.required = `${field.label} is required`;
    }

    if (field.type === "email") {
        rules.pattern = {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Please enter a valid email",
        };
    }

    if (field.type === "number") {
        rules.validate = (value) => {
            if (!value) return true;
            return (
                !Number.isNaN(Number(value)) || "Please enter a valid number"
            );
        };
    }

    if (field.type === "select" || field.type === "radio") {
        rules.validate = (value) => {
            if (!value) {
                return field.required ? `${field.label} is required` : true;
            }
            return (
                (field.options ?? []).includes(value) ||
                "Please choose one of the available options"
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

export function FormRenderer({ template, token }: FormRendererProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

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
                title: "Review and submit",
                description: "Confirm consent and send the completed form.",
                sections: [],
                fieldIds: [],
                kind: "consent",
            },
        ];
    }, [enabledSections, template.description, template.name, wizardMode]);

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
            toast.error("Please complete this step before continuing");
            return;
        }

        setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
    };

    const onSubmit = async (values: FormValues) => {
        if (values[CONSENT_FIELD_ID] !== "true") {
            setError(CONSENT_FIELD_ID, {
                type: "manual",
                message:
                    "Please review and accept the consent notice before submitting.",
            });
            toast.error("Consent is required before submitting");
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

    const handleFormSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (wizardMode && !isFinalWizardStep) {
            await goToNextStep();
            return;
        }

        await handleSubmit(onSubmit)(event);
    };

    const renderField = (field: TemplateFieldDoc) => {
        const errorMessage = getErrorMessage(errors[field.id]);

        if (field.type === "heading") {
            return (
                <div key={field.id} className="space-y-2 pt-2">
                    <h3 className="text-lg font-semibold tracking-tight">
                        {field.label}
                    </h3>
                    <div className="h-px w-full bg-border" />
                </div>
            );
        }

        if (field.type === "paragraph") {
            return (
                <p
                    key={field.id}
                    className="text-sm leading-6 text-muted-foreground"
                >
                    {field.label}
                </p>
            );
        }

        if (field.type === "signature") {
            return (
                <div key={field.id} className="space-y-2">
                    <Controller
                        name={field.id}
                        control={control}
                        rules={{
                            validate: (value) =>
                                !field.required || value
                                    ? true
                                    : `${field.label} is required`,
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
            <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </Label>

                {field.type === "text" && (
                    <Input
                        id={field.id}
                        placeholder={field.placeholder}
                        {...register(field.id, getFieldRules(field))}
                    />
                )}

                {field.type === "email" && (
                    <Input
                        id={field.id}
                        type="email"
                        placeholder={field.placeholder ?? "email@example.com"}
                        {...register(field.id, getFieldRules(field))}
                    />
                )}

                {field.type === "phone" && (
                    <Input
                        id={field.id}
                        type="tel"
                        placeholder={field.placeholder ?? "(555) 123-4567"}
                        {...register(field.id, getFieldRules(field))}
                    />
                )}

                {field.type === "date" && (
                    <Input
                        id={field.id}
                        type="date"
                        {...register(field.id, getFieldRules(field))}
                    />
                )}

                {field.type === "number" && (
                    <Input
                        id={field.id}
                        type="number"
                        placeholder={field.placeholder}
                        {...register(field.id, getFieldRules(field))}
                    />
                )}

                {field.type === "textarea" && (
                    <Textarea
                        id={field.id}
                        rows={4}
                        placeholder={field.placeholder}
                        {...register(field.id, getFieldRules(field))}
                    />
                )}

                {field.type === "select" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field)}
                        render={({ field: controllerField }) => (
                            <Select
                                value={controllerField.value ?? ""}
                                onValueChange={controllerField.onChange}
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
                    />
                )}

                {field.type === "radio" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field)}
                        render={({ field: controllerField }) => (
                            <RadioGroup
                                value={controllerField.value ?? ""}
                                onValueChange={controllerField.onChange}
                                className="gap-3"
                            >
                                {(field.options ?? []).map((option) => (
                                    <div
                                        key={option}
                                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                                    >
                                        <RadioGroupItem
                                            value={option}
                                            id={`${field.id}-${option}`}
                                        />
                                        <Label
                                            htmlFor={`${field.id}-${option}`}
                                        >
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    />
                )}

                {field.type === "checkbox" && (
                    <Controller
                        name={field.id}
                        control={control}
                        rules={getFieldRules(field)}
                        render={({ field: controllerField }) => (
                            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
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
                                    className="font-normal"
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
            className="rounded-3xl border-border/70 shadow-sm"
        >
            <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm font-semibold">
                        {enabledSections.findIndex(
                            (item) => item.id === section.id,
                        ) + 1}
                    </div>
                    <div>
                        <CardTitle className="text-xl tracking-tight">
                            {section.title}
                        </CardTitle>
                        {section.description && (
                            <CardDescription className="mt-1 text-sm leading-6">
                                {section.description}
                            </CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {section.fields.map(renderField)}
            </CardContent>
        </Card>
    );

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <Card className="overflow-hidden rounded-[28px] border-border/70 bg-gradient-to-br from-background via-background to-muted/40 shadow-sm">
                <CardContent className="flex flex-col gap-5 p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Secure patient form
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                                {template.name}
                            </h2>
                            {template.description && (
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    {template.description}
                                </p>
                            )}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
                            <LockKeyhole className="h-4 w-4" />
                            Encrypted submission
                        </div>
                    </div>

                    {wizardMode ? (
                        <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium">
                                    Step {currentStepIndex + 1} of{" "}
                                    {steps.length}
                                </span>
                                <span className="text-muted-foreground">
                                    {Math.round(progressValue)}% complete
                                </span>
                            </div>
                            <Progress value={progressValue} className="h-2.5" />
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Complete the form below, then review the consent
                            notice before submitting.
                        </div>
                    )}
                </CardContent>
            </Card>

            {wizardMode && currentStep ? (
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                    <Card className="rounded-3xl border-border/70 shadow-sm lg:sticky lg:top-6">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Form progress
                            </CardTitle>
                            <CardDescription>
                                Longer forms are split into smaller steps so
                                patients can move through them more clearly.
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
                            <Card className="rounded-3xl border-border/70 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Review and submit</CardTitle>
                                    <CardDescription>
                                        Confirm consent, then send the completed
                                        intake form to the clinic.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <ConsentNotice
                                        consentText={template.consentText}
                                        consentVersion={template.consentVersion}
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
                                Back
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
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Form"
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={goToNextStep}
                                    className="sm:min-w-44"
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
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
                                Submitting...
                            </>
                        ) : (
                            "Submit Form"
                        )}
                    </Button>
                </>
            )}

            <p className="text-center text-xs text-muted-foreground">
                Your information is encrypted in transit and stored securely for
                the clinic.
            </p>
        </form>
    );
}
