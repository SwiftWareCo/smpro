"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import {
    BookOpen,
    CheckCircle2,
    ClipboardList,
    FileText,
    FolderTree,
    Loader2,
    TrendingUp,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { usePortalClient } from "@/components/portal/portal-client-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatProjectDateTime } from "@/lib/date-utils";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type StatCardProps = {
    label: string;
    value: string;
    detail: string;
};

type PatientStats = {
    totalForms: number;
    activeForms: number;
    draftForms: number;
    totalSubmissions: number;
    recentSubmissions: number;
    latestSubmissionAt: number | null;
    recentItems: Array<{
        id: string;
        patientName: string;
        templateName: string;
        submittedAt: number;
        status: string;
    }>;
};

type KnowledgeBaseStats = {
    totalDocuments: number;
    totalFolders: number;
    readyDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
    latestDocumentAt: number | null;
    recentItems: Array<{
        id: string;
        title: string;
        updatedAt: number;
        status: string;
        charCount: number | null;
    }>;
};

function StatCard({ label, value, detail }: StatCardProps) {
    return (
        <Card className="border-border/70 bg-background/95 shadow-sm">
            <CardContent className="space-y-2 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {label}
                </p>
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                    {value}
                </p>
                <p className="text-sm text-muted-foreground">{detail}</p>
            </CardContent>
        </Card>
    );
}

export default function TenantDashboardPage() {
    const { clientId, clientName, enabledModules } = usePortalClient();
    const { isLoading, isAuthenticated } = useConvexAuth();
    const [dashboardNow] = useState(() => Date.now());

    const hasPatientForms = enabledModules.includes("patient_forms");
    const hasKnowledgeBase = enabledModules.includes("knowledge_base");

    const templates = useQuery(
        api.formTemplates.list,
        isAuthenticated && clientId && hasPatientForms
            ? { clientId }
            : ("skip" as const),
    );
    const submissions = useQuery(
        api.formSubmissions.list,
        isAuthenticated && clientId && hasPatientForms
            ? { clientId, limit: 5000 }
            : ("skip" as const),
    );
    const documents = useQuery(
        api.knowledgeBase.listDocuments,
        isAuthenticated && clientId && hasKnowledgeBase
            ? { clientId }
            : ("skip" as const),
    );
    const folders = useQuery(
        api.knowledgeBase.listFolders,
        isAuthenticated && clientId && hasKnowledgeBase
            ? { clientId }
            : ("skip" as const),
    );

    const patientStats = useMemo<PatientStats | null>(() => {
        if (!hasPatientForms) {
            return null;
        }
        if (!templates || !submissions) {
            return null;
        }

        const recentCutoff = dashboardNow - THIRTY_DAYS_MS;
        const activeForms = templates.filter(
            (template) => template.status === "active",
        ).length;
        const draftForms = templates.filter(
            (template) => template.status === "draft",
        ).length;
        const recentSubmissions = submissions.filter(
            (submission) => submission.submittedAt >= recentCutoff,
        ).length;

        const recentItems = submissions.slice(0, 5).map((submission) => {
            const template = templates.find(
                (item) => item._id === submission.templateId,
            );
            const formData = submission.formData as
                | Record<string, unknown>
                | undefined;
            const first = String(formData?.["first-name"] ?? "").trim();
            const last = String(formData?.["last-name"] ?? "").trim();
            const patientName = `${first} ${last}`.trim() || "Submission";

            return {
                id: submission._id,
                patientName,
                templateName: template?.name ?? "Patient form",
                submittedAt: submission.submittedAt,
                status: submission.status,
            };
        });

        return {
            totalForms: templates.length,
            activeForms,
            draftForms,
            totalSubmissions: submissions.length,
            recentSubmissions,
            latestSubmissionAt: submissions[0]?.submittedAt ?? null,
            recentItems,
        };
    }, [dashboardNow, hasPatientForms, submissions, templates]);

    const kbStats = useMemo<KnowledgeBaseStats | null>(() => {
        if (!hasKnowledgeBase) {
            return null;
        }
        if (!documents || !folders) {
            return null;
        }

        const readyDocuments = documents.filter(
            (doc) => doc.processingStatus === "ready",
        ).length;
        const processingDocuments = documents.filter((doc) =>
            ["pending", "extracting", "embedding"].includes(
                doc.processingStatus,
            ),
        ).length;
        const failedDocuments = documents.filter(
            (doc) => doc.processingStatus === "failed",
        ).length;

        const recentItems = documents.slice(0, 5).map((doc) => ({
            id: doc._id,
            title: doc.title,
            updatedAt: doc.updatedAt,
            status: doc.processingStatus,
            charCount: doc.charCount ?? null,
        }));

        return {
            totalDocuments: documents.length,
            totalFolders: folders.length,
            readyDocuments,
            processingDocuments,
            failedDocuments,
            latestDocumentAt: documents[0]?.updatedAt ?? null,
            recentItems,
        };
    }, [documents, folders, hasKnowledgeBase]);

    if (
        isLoading ||
        !isAuthenticated ||
        (hasPatientForms && !patientStats) ||
        (hasKnowledgeBase && !kbStats)
    ) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const badgeLabel =
        hasPatientForms && hasKnowledgeBase
            ? "Portal Overview"
            : hasPatientForms
              ? "Patient Forms"
              : hasKnowledgeBase
                ? "Knowledge Base"
                : "Client Portal";

    const headline =
        hasPatientForms || hasKnowledgeBase
            ? `${clientName} portal dashboard`
            : `${clientName} portal`;

    const description =
        hasPatientForms && hasKnowledgeBase
            ? "Track patient form activity and knowledge documents from one overview."
            : hasPatientForms
              ? "Monitor patient forms and submissions."
              : hasKnowledgeBase
                ? "Monitor document health and knowledge readiness."
                : "No portal modules are enabled for this client yet.";

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm">
                <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <Badge
                            variant="outline"
                            className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary"
                        >
                            {badgeLabel}
                        </Badge>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {headline}
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {hasPatientForms && (
                            <Button asChild className="rounded-xl px-5">
                                <Link href="/forms">
                                    <ClipboardList className="mr-2 h-4 w-4" />
                                    Open Patient Forms
                                </Link>
                            </Button>
                        )}
                        {hasKnowledgeBase && (
                            <Button
                                asChild
                                variant={
                                    hasPatientForms ? "outline" : "default"
                                }
                                className="rounded-xl px-5"
                            >
                                <Link href="/knowledge-base">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Open Knowledge Base
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {!hasPatientForms && !hasKnowledgeBase && (
                <Card className="border-border/70 bg-background/95 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">
                            Your dashboard will populate here as portal features
                            are set up.
                        </p>
                    </CardContent>
                </Card>
            )}

            {hasPatientForms && patientStats && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <StatCard
                            label="Total Forms"
                            value={String(patientStats.totalForms)}
                            detail={`${patientStats.activeForms} active, ${patientStats.draftForms} draft`}
                        />
                        <StatCard
                            label="Total Submissions"
                            value={String(patientStats.totalSubmissions)}
                            detail={
                                patientStats.latestSubmissionAt
                                    ? `Latest ${formatProjectDateTime(patientStats.latestSubmissionAt)}`
                                    : "No submissions yet"
                            }
                        />
                        <StatCard
                            label="Last 30 Days"
                            value={String(patientStats.recentSubmissions)}
                            detail="Recent patient intake activity"
                        />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                        <Card className="border-border/70 bg-background/95 shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">
                                        Recent Submissions
                                    </CardTitle>
                                    <CardDescription>
                                        Latest patient form activity across your
                                        portal.
                                    </CardDescription>
                                </div>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {patientStats.recentItems.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                                        No patient submissions yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {patientStats.recentItems.map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="space-y-1">
                                                        <p className="font-medium tracking-tight text-foreground">
                                                            {item.patientName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.templateName}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 text-left sm:text-right">
                                                        <p className="text-sm text-foreground">
                                                            {formatProjectDateTime(
                                                                item.submittedAt,
                                                            )}
                                                        </p>
                                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                            {item.status.replaceAll(
                                                                "_",
                                                                " ",
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/70 bg-background/95 shadow-sm">
                            <CardHeader className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-lg">
                                        Form Status
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Keep form inventory ready for new patients.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Active forms
                                        </span>
                                        <span className="text-lg font-semibold tracking-tight">
                                            {patientStats.activeForms}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Draft forms
                                        </span>
                                        <span className="text-lg font-semibold tracking-tight">
                                            {patientStats.draftForms}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {hasKnowledgeBase && kbStats && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <StatCard
                            label="Total Documents"
                            value={String(kbStats.totalDocuments)}
                            detail={
                                kbStats.latestDocumentAt
                                    ? `Latest ${formatProjectDateTime(kbStats.latestDocumentAt)}`
                                    : "No documents yet"
                            }
                        />
                        <StatCard
                            label="Ready Documents"
                            value={String(kbStats.readyDocuments)}
                            detail="Indexed and available for chat"
                        />
                        <StatCard
                            label="Folders"
                            value={String(kbStats.totalFolders)}
                            detail="Document organization groups"
                        />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                        <Card className="border-border/70 bg-background/95 shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">
                                        Recent Documents
                                    </CardTitle>
                                    <CardDescription>
                                        Latest uploads and processing results.
                                    </CardDescription>
                                </div>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {kbStats.recentItems.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                                        No documents uploaded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {kbStats.recentItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-medium tracking-tight text-foreground">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.charCount
                                                            ? `${item.charCount.toLocaleString()} chars`
                                                            : "No character count yet"}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 text-left sm:text-right">
                                                    <p className="text-sm text-foreground">
                                                        {formatProjectDateTime(
                                                            item.updatedAt,
                                                        )}
                                                    </p>
                                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                        {item.status}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/70 bg-background/95 shadow-sm">
                            <CardHeader className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-lg">
                                        Index Health
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Track processing and readiness of knowledge
                                    content.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Ready
                                        </span>
                                        <span className="text-lg font-semibold tracking-tight">
                                            {kbStats.readyDocuments}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Processing
                                        </span>
                                        <span className="text-lg font-semibold tracking-tight">
                                            {kbStats.processingDocuments}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Failed
                                        </span>
                                        <span className="text-lg font-semibold tracking-tight">
                                            {kbStats.failedDocuments}
                                        </span>
                                    </div>
                                </div>
                                {kbStats.failedDocuments === 0 && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        No failed documents right now.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
