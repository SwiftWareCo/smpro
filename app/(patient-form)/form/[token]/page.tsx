"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FormRenderer } from "@/components/patient-form/form-renderer";
import { Loader2, AlertCircle } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function PatientFormPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const formData = useQuery(api.formTemplates.getByToken, { token });

    if (formData === undefined) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                    Loading your form...
                </p>
            </div>
        );
    }

    if (formData === null) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        Form Unavailable
                    </CardTitle>
                    <CardDescription>
                        This form link is invalid, has expired, or has already
                        been submitted. Please contact the clinic for a new
                        link.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="rounded-[32px] border border-border/70 bg-background/85 p-6 text-center shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Patient intake
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    {formData.clientName}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                    {formData.template.name}
                </p>
                {formData.template.description && (
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {formData.template.description}
                    </p>
                )}
            </div>

            <FormRenderer template={formData.template} token={token} />
        </div>
    );
}
