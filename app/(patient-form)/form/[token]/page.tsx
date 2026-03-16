"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FormRenderer } from "@/components/patient-form/form-renderer";
import { LanguagePicker } from "@/components/patient-form/language-picker";
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
    type FormLanguage,
} from "@/lib/patient-form-i18n";
import { buildTenantThemeStyle } from "@/lib/tenant-theme";

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
    const [selectedLanguage, setSelectedLanguage] =
        useState<FormLanguage | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Determine the language to use for UI copy while loading
    const displayLanguage = normalizeFormLanguage(
        selectedLanguage ?? formData?.preferredLanguage ?? lang,
    );
    const copy = PATIENT_FORM_COPY[displayLanguage];

    // Resolve the correct template based on the selected language
    const resolvedTemplate = useMemo(() => {
        if (!formData) return null;

        // If no patient choice needed (language was pre-selected), template is already resolved
        if (formData.preferredLanguage) {
            return formData.template;
        }

        // Patient choice mode — need a selected language
        if (!selectedLanguage) return null;

        // English: use the base template directly
        if (selectedLanguage === "en") {
            return formData.template;
        }

        // Find the matching localized template
        const localizedTemplates =
            "localizedTemplates" in formData
                ? (formData.localizedTemplates as Array<{
                      language: string;
                      name: string;
                      description?: string;
                      sections: typeof formData.template.sections;
                      consentText: string;
                      consentVersion: string;
                  }>)
                : [];

        const match = localizedTemplates.find(
            (t) => t.language === selectedLanguage,
        );
        if (!match) return formData.template;

        return {
            ...formData.template,
            name: match.name,
            description: match.description,
            sections: match.sections,
            consentText: match.consentText,
            consentVersion: match.consentVersion,
        };
    }, [formData, selectedLanguage]);

    if (formData === undefined) {
        return (
            <div
                className="flex min-h-[60vh] flex-col items-center justify-center"
                dir={isRtlLanguage(displayLanguage) ? "rtl" : "ltr"}
                lang={displayLanguage}
            >
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">{copy.loading}</p>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                    {copy.submitting}
                </p>
            </div>
        );
    }

    if (formData === null) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Card
                    className="mx-auto w-full max-w-xl rounded-2xl border-border/70 bg-background/95 shadow-sm backdrop-blur"
                    dir={isRtlLanguage(displayLanguage) ? "rtl" : "ltr"}
                    lang={displayLanguage}
                >
                    <CardHeader className="space-y-3 p-6 sm:p-8">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <CardTitle className="text-xl leading-tight sm:text-2xl">
                            {copy.unavailableTitle}
                        </CardTitle>
                        <CardDescription className="max-w-prose text-sm leading-7 sm:text-base">
                            {copy.unavailableDescription}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Determine if we need the language picker
    const needsLanguagePicker =
        !formData.preferredLanguage &&
        !selectedLanguage &&
        !lang &&
        "availableLanguages" in formData &&
        Array.isArray(formData.availableLanguages) &&
        formData.availableLanguages.length > 1;

    if (needsLanguagePicker) {
        return (
            <div className="mx-auto max-w-5xl">
                <LanguagePicker
                    availableLanguages={formData.availableLanguages as string[]}
                    clientName={formData.clientName}
                    onSelect={(language) => setSelectedLanguage(language)}
                />
            </div>
        );
    }

    // If lang query param was provided but no preferredLanguage, use it
    const effectiveLanguage =
        selectedLanguage ??
        normalizeFormLanguage(formData.preferredLanguage ?? lang);

    // Resolve template for lang query param case (no picker shown)
    const finalTemplate =
        resolvedTemplate ??
        (() => {
            if (!lang || lang === "en") return formData.template;
            const localizedTemplates =
                "localizedTemplates" in formData
                    ? (formData.localizedTemplates as Array<{
                          language: string;
                          name: string;
                          description?: string;
                          sections: typeof formData.template.sections;
                          consentText: string;
                          consentVersion: string;
                      }>)
                    : [];
            const match = localizedTemplates.find((t) => t.language === lang);
            if (!match) return formData.template;
            return {
                ...formData.template,
                name: match.name,
                description: match.description,
                sections: match.sections,
                consentText: match.consentText,
                consentVersion: match.consentVersion,
            };
        })();

    return (
        <div
            className="mx-auto max-w-5xl"
            dir={isRtlLanguage(effectiveLanguage) ? "rtl" : "ltr"}
            lang={effectiveLanguage}
            style={buildTenantThemeStyle({
                primaryColor: formData.portalPrimaryColor,
                secondaryColor: formData.portalSecondaryColor,
            })}
        >
            <FormRenderer
                template={finalTemplate}
                token={token}
                language={effectiveLanguage}
                clientName={formData.clientName}
                onSubmitStart={() => setIsSubmitted(true)}
            />
        </div>
    );
}
