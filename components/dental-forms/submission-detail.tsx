"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Copy } from "lucide-react";
import { formatProjectDate, formatProjectDateTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface SubmissionDetailProps {
    submission: Doc<"formSubmissions">;
    onBack: () => void;
}

type TemplateSectionDoc = Doc<"formTemplates">["sections"][number];
type TemplateFieldDoc = TemplateSectionDoc["fields"][number];

interface DisplayAnswer {
    key: string;
    label: string;
    value: string;
    copyValue: string;
    wide: boolean;
    kind: "text" | "signature";
}

interface DisplaySection {
    id: string;
    title: string;
    description?: string;
    answers: DisplayAnswer[];
}

const FOLLOW_UP_SUFFIX = "__followUp";

const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    exported: "Exported",
    entered_in_pms: "Entered in PMS",
};

const statusColors: Record<string, string> = {
    submitted:
        "border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
    under_review:
        "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-200",
    approved:
        "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-200",
    exported:
        "border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-900/80 dark:bg-violet-950/40 dark:text-violet-200",
    entered_in_pms:
        "border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200",
};

function isPresent(value: unknown): value is string | number | boolean {
    if (value === null || value === undefined) {
        return false;
    }
    return String(value).trim().length > 0;
}

function humanizeKey(key: string): string {
    const normalized = key.replace(FOLLOW_UP_SUFFIX, "").replace(/[-_]/g, " ");
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase()).trim();
}

function isLikelyGeneratedFieldId(key: string): boolean {
    return /^[a-z]?[-_\s]?\d{8,}/i.test(key) || /\d{10,}/.test(key);
}

function isSignatureValue(value: string): boolean {
    return /^data:image\/[a-zA-Z+.-]+;base64,/.test(value);
}

function isDateLikeValue(value: string): boolean {
    return (
        /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)
    );
}

function formatAddressValue(value: string): { display: string; copy: string } {
    const separator = " — ";
    const sepIndex = value.indexOf(separator);

    if (sepIndex === -1) {
        return { display: value, copy: value };
    }

    const firstPart = value.slice(0, sepIndex).trim();
    const secondPart = value.slice(sepIndex + separator.length).trim();

    if (!secondPart) {
        return { display: value, copy: value };
    }

    const unitLine = firstPart.replace(/^(Unit|Apt|Suite|#)\s*/i, "").trim();

    if (!unitLine) {
        return { display: secondPart, copy: secondPart };
    }

    return {
        display: `${secondPart}\n${unitLine}`,
        copy: `${secondPart}\n${unitLine}`,
    };
}

function isWideAnswer(field: TemplateFieldDoc | null, value: string): boolean {
    if (field?.type === "textarea" || field?.type === "signature") {
        return true;
    }

    return value.includes("\n") || value.length > 80;
}

function formatAnswerValue(field: TemplateFieldDoc | null, value: string) {
    if (field?.type === "date" || (!field && isDateLikeValue(value))) {
        return {
            display: formatProjectDate(value) || value,
            copy: value,
        };
    }

    if (field?.type === "address") {
        return formatAddressValue(value);
    }

    if (field?.type === "checkbox") {
        if (value === "true") {
            return {
                display: field.placeholder?.trim() || "Yes",
                copy: field.placeholder?.trim() || "Yes",
            };
        }
        if (value === "false") {
            return {
                display: "No",
                copy: "No",
            };
        }
    }

    return {
        display: value,
        copy: value,
    };
}

export function SubmissionDetail({
    submission,
    onBack,
}: SubmissionDetailProps) {
    const formData = useMemo(
        () => (submission.formData ?? {}) as Record<string, unknown>,
        [submission.formData],
    );
    const template = useQuery(api.formTemplates.get, {
        templateId: submission.templateId,
    });

    const handlePrint = () => {
        window.print();
    };

    const handleCopyField = async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            try {
                const textarea = document.createElement("textarea");
                textarea.value = value;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                toast.success(`${label} copied`);
            } catch {
                toast.error("Failed to copy");
            }
        }
    };

    const firstName = formData["first-name"] ?? "";
    const lastName = formData["last-name"] ?? "";
    const patientName = `${firstName} ${lastName}`.trim() || "Submission";

    const displaySections = useMemo<DisplaySection[]>(() => {
        if (template === undefined) {
            return [];
        }

        const consumedKeys = new Set<string>();
        const sections: DisplaySection[] = [];

        const addAnswer = (
            answers: DisplayAnswer[],
            key: string,
            label: string,
            rawValue: unknown,
            field: TemplateFieldDoc | null,
        ) => {
            if (!isPresent(rawValue)) {
                return;
            }

            const value = String(rawValue).trim();
            const formatted = formatAnswerValue(field, value);
            answers.push({
                key,
                label,
                value: formatted.display,
                copyValue: formatted.copy,
                wide: isWideAnswer(field, formatted.display),
                kind:
                    field?.type === "signature" && isSignatureValue(value)
                        ? "signature"
                        : "text",
            });
            consumedKeys.add(key);
        };

        for (const section of template?.sections ?? []) {
            if (!section.enabled) continue;

            const answers: DisplayAnswer[] = [];
            for (const field of section.fields) {
                addAnswer(
                    answers,
                    field.id,
                    field.label,
                    formData[field.id],
                    field,
                );

                if (field.followUp?.enabled) {
                    const followUpKey = `${field.id}${FOLLOW_UP_SUFFIX}`;
                    addAnswer(
                        answers,
                        followUpKey,
                        field.followUp.label,
                        formData[followUpKey],
                        {
                            ...field,
                            label: field.followUp.label,
                            type: "textarea",
                        },
                    );
                }
            }

            if (answers.length > 0) {
                sections.push({
                    id: section.id,
                    title: section.title,
                    description: section.description,
                    answers,
                });
            }
        }

        const additionalAnswers = Object.entries(formData)
            .filter(
                ([key, value]) => !consumedKeys.has(key) && isPresent(value),
            )
            .map(([key, value], index) => {
                const rawValue = String(value).trim();
                return {
                    key,
                    label: isLikelyGeneratedFieldId(key)
                        ? `Additional Response ${index + 1}`
                        : humanizeKey(key) ||
                          `Additional Response ${index + 1}`,
                    value: formatAnswerValue(null, rawValue).display,
                    copyValue: formatAnswerValue(null, rawValue).copy,
                    wide: rawValue.includes("\n") || rawValue.length > 80,
                    kind: isSignatureValue(rawValue) ? "signature" : "text",
                } satisfies DisplayAnswer;
            });

        if (additionalAnswers.length > 0) {
            sections.push({
                id: "additional-information",
                title: "Additional Information",
                description:
                    "Responses saved on the submission that are not part of the current form structure.",
                answers: additionalAnswers,
            });
        }

        return sections;
    }, [formData, template]);

    return (
        <div className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-200 space-y-6 pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="mt-0.5 print:hidden"
                        type="button"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                        <h3 className="text-xl font-semibold tracking-tight">
                            {patientName}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Submitted{" "}
                            {formatProjectDateTime(submission.submittedAt)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium",
                            statusColors[submission.status],
                        )}
                    >
                        {statusLabels[submission.status] ?? submission.status}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="print:hidden"
                        type="button"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            {template === undefined ? (
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Card
                            key={index}
                            className="rounded-[28px] border-border/70 shadow-sm"
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-64" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                                {Array.from({ length: 4 }).map(
                                    (__unused, itemIndex) => (
                                        <Skeleton
                                            key={itemIndex}
                                            className="h-28 rounded-2xl"
                                        />
                                    ),
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {displaySections.length === 0 ? (
                        <Card className="rounded-[28px] border-border/70 shadow-sm">
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No submitted answers are available for this
                                form.
                            </CardContent>
                        </Card>
                    ) : (
                        displaySections.map((section, sectionIndex) => (
                            <Card
                                key={section.id}
                                className="rounded-[28px] border-border/70 shadow-sm"
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/25 text-sm font-semibold">
                                            {String(sectionIndex + 1).padStart(
                                                2,
                                                "0",
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-base tracking-tight">
                                                {section.title}
                                            </CardTitle>
                                            {section.description && (
                                                <p className="text-sm leading-6 text-muted-foreground">
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-3 md:grid-cols-2">
                                    {section.answers.map((answer) => (
                                        <div
                                            key={answer.key}
                                            className={cn(
                                                "group relative rounded-2xl border border-border/60 bg-muted/15 p-4 shadow-sm",
                                                answer.wide && "md:col-span-2",
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                                        {answer.label}
                                                    </p>

                                                    {answer.kind ===
                                                    "signature" ? (
                                                        <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-white p-3">
                                                            <Image
                                                                src={
                                                                    answer.copyValue
                                                                }
                                                                alt={`${answer.label} signature`}
                                                                width={640}
                                                                height={220}
                                                                className="max-h-36 w-full object-contain"
                                                                unoptimized
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-6 text-foreground">
                                                            {answer.value}
                                                        </p>
                                                    )}
                                                </div>

                                                {answer.kind === "text" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0 opacity-100 transition-opacity sm:opacity-70 sm:hover:opacity-100 focus-visible:opacity-100 print:hidden"
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopyField(
                                                                answer.label,
                                                                answer.copyValue,
                                                            )
                                                        }
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
