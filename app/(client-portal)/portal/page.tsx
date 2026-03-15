"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { ClipboardList, FileText, Loader2, TrendingUp } from "lucide-react";
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
    const { clientId, clientName } = usePortalClient();
    const { isLoading, isAuthenticated } = useConvexAuth();
    const [dashboardNow] = useState(() => Date.now());

    const queryArgs =
        isAuthenticated && clientId ? { clientId } : ("skip" as const);
    const templates = useQuery(api.formTemplates.list, queryArgs);
    const submissions = useQuery(
        api.formSubmissions.list,
        isAuthenticated && clientId
            ? { clientId, limit: 5000 }
            : ("skip" as const),
    );

    const stats = useMemo(() => {
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
        const archivedForms = templates.filter(
            (template) => template.status === "archived",
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
            archivedForms,
            totalSubmissions: submissions.length,
            recentSubmissions,
            latestSubmissionAt: submissions[0]?.submittedAt ?? null,
            recentItems,
        };
    }, [dashboardNow, submissions, templates]);

    if (
        isLoading ||
        !isAuthenticated ||
        templates === undefined ||
        submissions === undefined ||
        !stats
    ) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm">
                <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <Badge
                            variant="outline"
                            className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary"
                        >
                            Patient Forms
                        </Badge>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {clientName} forms dashboard
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                A simple view of form inventory and incoming
                                patient submissions.
                            </p>
                        </div>
                    </div>

                    <Button asChild className="rounded-xl px-5">
                        <Link href="/forms">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Open Patient Forms
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total Forms"
                    value={String(stats.totalForms)}
                    detail={`${stats.activeForms} active, ${stats.draftForms} draft`}
                />
                <StatCard
                    label="Total Submissions"
                    value={String(stats.totalSubmissions)}
                    detail={
                        stats.latestSubmissionAt
                            ? `Latest ${formatProjectDateTime(stats.latestSubmissionAt)}`
                            : "No submissions yet"
                    }
                />
                <StatCard
                    label="Last 30 Days"
                    value={String(stats.recentSubmissions)}
                    detail="Recent patient intake activity"
                />
                <StatCard
                    label="Archived Forms"
                    value={String(stats.archivedForms)}
                    detail="Inactive forms kept for reference"
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
                                The latest patient form activity across your
                                portal.
                            </CardDescription>
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {stats.recentItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                                No patient submissions yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.recentItems.map((item) => (
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
                                ))}
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
                            Keep the dashboard focused on form readiness.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Active forms
                                </span>
                                <span className="text-lg font-semibold tracking-tight">
                                    {stats.activeForms}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Draft forms
                                </span>
                                <span className="text-lg font-semibold tracking-tight">
                                    {stats.draftForms}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Archived forms
                                </span>
                                <span className="text-lg font-semibold tracking-tight">
                                    {stats.archivedForms}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
