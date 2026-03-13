"use client";

import { useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Inbox } from "lucide-react";
import { SubmissionDetail } from "./submission-detail";

interface SubmissionsListProps {
    submissions: Doc<"formSubmissions">[];
}

const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    exported: "Exported",
    entered_in_pms: "Entered in PMS",
};

const statusColors: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    exported: "bg-purple-100 text-purple-800",
    entered_in_pms: "bg-gray-100 text-gray-800",
};

function getPatientName(submission: Doc<"formSubmissions">): string {
    const data = submission.formData as Record<string, unknown> | undefined;
    if (!data) return "Submission";
    const first = data["first-name"] ?? "";
    const last = data["last-name"] ?? "";
    const name = `${first} ${last}`.trim();
    return name || "Submission";
}

export function SubmissionsList({ submissions }: SubmissionsListProps) {
    const [selectedSubmission, setSelectedSubmission] =
        useState<Doc<"formSubmissions"> | null>(null);

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

            <div className="grid gap-3">
                {submissions.map((submission) => (
                    <Card
                        key={submission._id}
                        className="hover:shadow-sm transition-shadow"
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base">
                                        {getPatientName(submission)}
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={
                                            statusColors[submission.status]
                                        }
                                    >
                                        {statusLabels[submission.status] ??
                                            submission.status}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setSelectedSubmission(submission)
                                        }
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>
                                    Submitted{" "}
                                    {new Date(
                                        submission.submittedAt,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
