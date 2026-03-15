"use client";

import {
    FORM_LANGUAGE_LABELS,
    FORM_LANGUAGE_NATIVE_NAMES,
    type FormLanguage,
} from "@/lib/patient-form-i18n";

interface LanguagePickerProps {
    availableLanguages: string[];
    clientName: string;
    onSelect: (language: FormLanguage) => void;
}

export function LanguagePicker({
    availableLanguages,
    clientName,
    onSelect,
}: LanguagePickerProps) {
    return (
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        {clientName}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Choose your language
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Select the language you are most comfortable with.
                    </p>
                </div>

                <div className="grid gap-3">
                    {availableLanguages.map((lang) => {
                        const language = lang as FormLanguage;
                        const nativeName =
                            FORM_LANGUAGE_NATIVE_NAMES[language] ?? language;
                        const englishName =
                            FORM_LANGUAGE_LABELS[language] ?? language;

                        return (
                            <button
                                key={language}
                                type="button"
                                onClick={() => onSelect(language)}
                                className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-5 py-4 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10"
                            >
                                <div className="space-y-0.5">
                                    <p className="text-base font-medium">
                                        {nativeName}
                                    </p>
                                    {nativeName !== englishName && (
                                        <p className="text-sm text-muted-foreground">
                                            {englishName}
                                        </p>
                                    )}
                                </div>
                                <svg
                                    className="h-5 w-5 text-muted-foreground"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                    />
                                </svg>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
