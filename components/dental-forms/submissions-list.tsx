"use client";

import { useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Inbox } from "lucide-react";
import { SubmissionDetail } from "./submission-detail";
import { formatProjectDateTime } from "@/lib/date-utils";

type SubmissionListItem = Doc<"formSubmissions"> & {
    submittedByName: string;
    templateName: string;
    templateVersion: number | null;
};

interface SubmissionsListProps {
    submissions: SubmissionListItem[];
}

const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    exported: "Exported",
    entered_in_pms: "Entered in PMS",
};

const statusColors: Record<string, string> = {
    submitted: "bg-slate-100 text-slate-700",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    exported: "bg-purple-100 text-purple-800",
    entered_in_pms: "bg-gray-100 text-gray-800",
};

export function SubmissionsList({ submissions }: SubmissionsListProps) {
    const [selectedSubmission, setSelectedSubmission] =
        useState<SubmissionListItem | null>(null);

    if (selectedSubmission) {
        return (
            <SubmissionDetail
                submission={selectedSubmission}
                onBack={() => setSelectedSubmission(null)}
            />
        );
    }

    if (submissions.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        No submissions yet
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                        Submissions will appear here when patients complete
                        their forms.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium">Form Submissions</h3>
                <p className="text-sm text-muted-foreground">
                    Review and manage patient form submissions
                </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {submissions.map((submission) => (
                    <Card
                        key={submission._id}
                        className="overflow-hidden transition-colors hover:bg-muted/20"
                    >
                        <CardHeader className="px-2.5 pt-2.5 pb-1.5">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex items-center gap-1.5">
                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                    <CardTitle
                                        className="truncate text-[13px]"
                                        title={submission.submittedByName}
                                    >
                                        {submission.submittedByName}
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge
                                        variant="secondary"
                                        className={`${statusColors[submission.status]} px-1 py-0 text-[9px]`}
                                    >
                                        {statusLabels[submission.status] ??
                                            submission.status}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-[11px]"
                                        onClick={() =>
                                            setSelectedSubmission(submission)
                                        }
                                    >
                                        <Eye className="mr-1 h-3 w-3" />
                                        View
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2.5 pt-0 pb-2.5">
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="rounded-md bg-muted/40 px-1.5 py-0.5">
                                    Form {submission.templateName}
                                    {submission.templateVersion
                                        ? ` (v${submission.templateVersion})`
                                        : ""}
                                </span>
                                <span className="rounded-md bg-muted/40 px-1.5 py-0.5">
                                    Submitted{" "}
                                    {formatProjectDateTime(
                                        submission.submittedAt,
                                    )}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
