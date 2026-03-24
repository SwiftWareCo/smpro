"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PATIENT_FORM_COPY, type FormLanguage } from "@/lib/patient-form-i18n";

interface ConsentNoticeProps {
    consentText: string;
    language: FormLanguage;
    agreed: boolean;
    onAgreeChange: (agreed: boolean) => void;
}

export function ConsentNotice({
    consentText,
    language,
    agreed,
    onAgreeChange,
}: ConsentNoticeProps) {
    const [expanded, setExpanded] = useState(false);
    const copy = PATIENT_FORM_COPY[language];

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {copy.consentTitle}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="text-sm text-primary hover:text-primary/80 p-0 h-auto"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="mr-1 h-4 w-4" />
                                {copy.consentToggleClose}
                            </>
                        ) : (
                            <>
                                <ChevronDown className="mr-1 h-4 w-4" />
                                {copy.consentToggleOpen}
                            </>
                        )}
                    </Button>

                    {expanded && (
                        <div className="mt-3 p-4 bg-background rounded-md border text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {consentText}
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-primary/25 bg-background/90 p-3 shadow-sm">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="consent"
                            checked={agreed}
                            className="mt-0.5 size-5 border-primary/60 bg-background shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:ring-primary/30"
                            onCheckedChange={(checked) =>
                                onAgreeChange(checked === true)
                            }
                        />
                        <Label
                            htmlFor="consent"
                            className="cursor-pointer text-sm leading-relaxed font-medium text-foreground"
                        >
                            {copy.consentAgreement}
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
