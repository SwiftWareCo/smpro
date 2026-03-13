"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsentNoticeProps {
    consentText: string;
    consentVersion: string;
    agreed: boolean;
    onAgreeChange: (agreed: boolean) => void;
}

export function ConsentNotice({
    consentText,
    consentVersion,
    agreed,
    onAgreeChange,
}: ConsentNoticeProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Consent for Collection of Personal Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="text-sm text-amber-700 hover:text-amber-800 p-0 h-auto"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="mr-1 h-4 w-4" />
                                Hide full consent text
                            </>
                        ) : (
                            <>
                                <ChevronDown className="mr-1 h-4 w-4" />
                                Read full consent text
                            </>
                        )}
                    </Button>

                    {expanded && (
                        <div className="mt-3 p-4 bg-white rounded-md border text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {consentText}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                        Consent version: {consentVersion}
                    </p>
                </div>

                <div className="flex items-start gap-3">
                    <Checkbox
                        id="consent"
                        checked={agreed}
                        onCheckedChange={(checked) =>
                            onAgreeChange(checked === true)
                        }
                    />
                    <Label
                        htmlFor="consent"
                        className="text-sm leading-relaxed cursor-pointer"
                    >
                        I have read and agree to the collection, use, and
                        disclosure of my personal information as described in the
                        consent notice above.
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
}
