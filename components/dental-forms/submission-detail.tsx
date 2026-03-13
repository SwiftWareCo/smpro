"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Shield, Copy } from "lucide-react";

interface SubmissionDetailProps {
    submission: Doc<"formSubmissions">;
    onBack: () => void;
}

export function SubmissionDetail({
    submission,
    onBack,
}: SubmissionDetailProps) {
    const formData = (submission.formData ?? {}) as Record<string, unknown>;

    const handlePrint = () => {
        window.print();
    };

    const handleCopyField = async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const firstName = formData["first-name"] ?? "";
    const lastName = formData["last-name"] ?? "";
    const patientName = `${firstName} ${lastName}`.trim() || "Submission";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h3 className="text-lg font-medium">{patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                        Submitted{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                </div>
                <Badge
                    variant="secondary"
                    className={
                        submission.status === "submitted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                    }
                >
                    {submission.status}
                </Badge>
            </div>

            {/* Form Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        Patient Health Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2 print:hidden">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-3 print:space-y-2">
                            {Object.entries(formData).map(([key, value]) => {
                                if (
                                    value === null ||
                                    value === undefined ||
                                    value === ""
                                ) {
                                    return null;
                                }
                                const displayLabel = key
                                    .replace(/[-_]/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase());
                                const displayValue = String(value);

                                return (
                                    <div
                                        key={key}
                                        className="flex items-start justify-between gap-4 py-1"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground">
                                                {displayLabel}
                                            </p>
                                            <p className="text-sm break-words">
                                                {displayValue}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 print:hidden"
                                            onClick={() =>
                                                handleCopyField(
                                                    displayLabel,
                                                    displayValue,
                                                )
                                            }
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="print:hidden">
                <CardHeader>
                    <CardTitle className="text-base">
                        Submission Metadata
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <p>{submission.status}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p>
                                {new Date(
                                    submission.submittedAt,
                                ).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
