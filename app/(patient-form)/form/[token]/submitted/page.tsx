import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import {
    normalizeFormLanguage,
    PATIENT_FORM_COPY,
    isRtlLanguage,
} from "@/lib/patient-form-i18n";

export default async function FormSubmittedPage({
    searchParams,
}: {
    searchParams: Promise<{ lang?: string }>;
}) {
    const { lang } = await searchParams;
    const language = normalizeFormLanguage(lang);
    const copy = PATIENT_FORM_COPY[language];

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card
                className="mx-auto w-full max-w-2xl rounded-2xl border-border/70 shadow-sm sm:rounded-[32px]"
                dir={isRtlLanguage(language) ? "rtl" : "ltr"}
                lang={language}
            >
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                        {copy.submittedTitle}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {copy.submittedDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {copy.submittedBody}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {copy.submittedCloseHint}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
