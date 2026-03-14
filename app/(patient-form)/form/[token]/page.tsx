"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FormRenderer } from "@/components/patient-form/form-renderer";
import { Loader2, AlertCircle } from "lucide-react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    normalizeFormLanguage,
    PATIENT_FORM_COPY,
    isRtlLanguage,
} from "@/lib/patient-form-i18n";

export default function PatientFormPage({
    params,
    searchParams,
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ lang?: string }>;
}) {
    const { token } = use(params);
    const { lang } = use(searchParams);
    const formData = useQuery(api.formTemplates.getByToken, { token });
    const preferredLanguage = normalizeFormLanguage(
        formData?.preferredLanguage ?? lang,
    );
    const copy = PATIENT_FORM_COPY[preferredLanguage];

    if (formData === undefined) {
        return (
            <div
                className="flex flex-col items-center justify-center py-24"
                dir={isRtlLanguage(preferredLanguage) ? "rtl" : "ltr"}
                lang={preferredLanguage}
            >
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">{copy.loading}</p>
            </div>
        );
    }

    if (formData === null) {
        return (
            <Card
                dir={isRtlLanguage(preferredLanguage) ? "rtl" : "ltr"}
                lang={preferredLanguage}
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        {copy.unavailableTitle}
                    </CardTitle>
                    <CardDescription>
                        {copy.unavailableDescription}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div
            className="mx-auto max-w-5xl"
            dir={isRtlLanguage(preferredLanguage) ? "rtl" : "ltr"}
            lang={preferredLanguage}
        >
            <FormRenderer
                template={formData.template}
                token={token}
                language={preferredLanguage}
                clientName={formData.clientName}
            />
        </div>
    );
}
