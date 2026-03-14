"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Copy,
    Loader2,
    Link,
    Mail,
    Smartphone,
    QrCode,
    Download,
    Printer,
    CheckCircle,
} from "lucide-react";
import type { DeliveryChannel } from "@/lib/validation/dental-form";
import {
    FORM_LANGUAGE_LABELS,
    type FormLanguage,
} from "@/lib/patient-form-i18n";

interface DeliveryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: Id<"clients">;
    template: Doc<"formTemplates"> | null;
}

const channelOptions: {
    value: DeliveryChannel;
    label: string;
    icon: React.ReactNode;
}[] = [
    {
        value: "link",
        label: "Shareable Link",
        icon: <Link className="h-4 w-4" />,
    },
    { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { value: "sms", label: "SMS", icon: <Smartphone className="h-4 w-4" /> },
    { value: "qr", label: "QR Code", icon: <QrCode className="h-4 w-4" /> },
];

const buttonLabels: Record<DeliveryChannel, string> = {
    link: "Generate Form Link",
    email: "Generate & Send Email",
    qr: "Generate QR Code",
    sms: "Generate Form Link",
    tablet: "Generate Form Link",
};

export function DeliveryDialog({
    open,
    onOpenChange,
    clientId,
    template,
}: DeliveryDialogProps) {
    const [channel, setChannel] = useState<DeliveryChannel>("link");
    const [patientName, setPatientName] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [preferredLanguage, setPreferredLanguage] =
        useState<FormLanguage>("en");
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [generating, setGenerating] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [deliveryResult, setDeliveryResult] = useState<{
        deliveryId: Id<"formDeliveries">;
        token: string;
        formUrl: string;
        expiresAt: number;
    } | null>(null);

    const qrRef = useRef<HTMLDivElement>(null);

    const createLink = useAction(api.formDeliveriesActions.createLink);
    const sendEmailAction = useAction(api.formDeliveriesActions.sendEmail);

    useEffect(() => {
        if (!open) {
            setGeneratedUrl("");
            setPatientName("");
            setRecipientEmail("");
            setRecipientPhone("");
            setChannel("link");
            setPreferredLanguage("en");
            setGenerating(false);
            setEmailSending(false);
            setEmailSent(false);
            setEmailError(false);
            setDeliveryResult(null);
        }
    }, [open]);

    const handleGenerate = async () => {
        if (!template) {
            toast.error("Choose a template before generating a patient link");
            return;
        }

        if (channel === "email" && !recipientEmail.trim()) {
            toast.error("Please enter a patient email address");
            return;
        }

        setGenerating(true);
        try {
            const result = await createLink({
                clientId,
                templateId: template._id,
                channel,
                preferredLanguage,
            });

            setGeneratedUrl(result.formUrl);
            setDeliveryResult(result);

            if (channel === "email") {
                setEmailSending(true);
                try {
                    await sendEmailAction({
                        deliveryId: result.deliveryId,
                        clientId,
                        templateName: template.name,
                        recipientEmail: recipientEmail.trim(),
                        patientName: patientName.trim() || undefined,
                        formUrl: result.formUrl,
                        expiresAt: result.expiresAt,
                    });
                    setEmailSent(true);
                    toast.success("Email sent successfully");
                } catch (error) {
                    console.error("Send email error:", error);
                    setEmailError(true);
                    toast.error(
                        "Failed to send email. You can copy the link below.",
                    );
                } finally {
                    setEmailSending(false);
                }
            } else {
                toast.success("Form link generated");
            }
        } catch (error) {
            console.error("Generate link error:", error);
            toast.error("Failed to generate form link");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedUrl);
            toast.success("Link copied to clipboard");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleDownloadQr = useCallback(() => {
        const svgElement = qrRef.current?.querySelector("svg");
        if (!svgElement) return;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `form-qr-${template?.name?.replace(/\s+/g, "-").toLowerCase() ?? "code"}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [template?.name]);

    const handlePrintQr = useCallback(() => {
        const svgElement = qrRef.current?.querySelector("svg");
        if (!svgElement) return;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>QR Code — ${template?.name ?? "Form"}</title>
<style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;}
h2{margin-bottom:16px;color:#333;}p{color:#666;font-size:14px;margin-top:12px;}</style></head>
<body><h2>${template?.name ?? "Patient Form"}</h2>${svgString}<p>Scan to open form</p>
<script>window.onafterprint=()=>window.close();window.print();</script></body></html>`);
        printWindow.document.close();
    }, [template?.name]);

    const handleReset = () => {
        setGeneratedUrl("");
        setPatientName("");
        setRecipientEmail("");
        setRecipientPhone("");
        setPreferredLanguage("en");
        setEmailSending(false);
        setEmailSent(false);
        setEmailError(false);
        setDeliveryResult(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Send Form to Patient</DialogTitle>
                    <DialogDescription>
                        {template
                            ? `Generate a secure link for "${template.name}". Links expire after 72 hours.`
                            : "Choose a template to generate a secure patient link."}
                    </DialogDescription>
                </DialogHeader>

                {!generatedUrl ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="channel">Delivery Method</Label>
                            <Select
                                value={channel}
                                onValueChange={(v) =>
                                    setChannel(v as DeliveryChannel)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {channelOptions.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            <div className="flex items-center gap-2">
                                                {opt.icon}
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="patient-name">
                                Patient Name (optional, not stored)
                            </Label>
                            <Input
                                id="patient-name"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="John Smith"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="preferred-language">
                                Preferred Form Language
                            </Label>
                            <Select
                                value={preferredLanguage}
                                onValueChange={(value) =>
                                    setPreferredLanguage(value as FormLanguage)
                                }
                            >
                                <SelectTrigger id="preferred-language">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(FORM_LANGUAGE_LABELS).map(
                                        ([value, label]) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {channel === "email" && (
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Patient Email (not stored)
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) =>
                                        setRecipientEmail(e.target.value)
                                    }
                                    placeholder="patient@email.com"
                                />
                            </div>
                        )}

                        {channel === "sms" && (
                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    Patient Phone (not stored)
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={recipientPhone}
                                    onChange={(e) =>
                                        setRecipientPhone(e.target.value)
                                    }
                                    placeholder="+1 (604) 555-0123"
                                />
                            </div>
                        )}

                        <Separator />

                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                buttonLabels[channel]
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {channel === "qr" && (
                            <div className="space-y-3">
                                <Label>QR Code</Label>
                                <div
                                    ref={qrRef}
                                    className="flex justify-center rounded-lg border bg-white p-4"
                                >
                                    <QRCodeSVG
                                        value={generatedUrl}
                                        size={200}
                                        level="M"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleDownloadQr}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download SVG
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handlePrintQr}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print
                                    </Button>
                                </div>
                            </div>
                        )}

                        {channel === "email" && (
                            <div className="space-y-2">
                                {emailSending && (
                                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            Sending email to {recipientEmail}...
                                        </p>
                                    </div>
                                )}
                                {emailSent && (
                                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Email sent to {recipientEmail}
                                        </p>
                                    </div>
                                )}
                                {emailError && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-destructive">
                                            Failed to send email. Please copy
                                            the link below and send it manually.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {channel === "sms" && (
                            <p className="text-sm text-muted-foreground">
                                SMS delivery is not yet configured. Please copy
                                and send the link manually for now.
                            </p>
                        )}

                        <div className="space-y-2">
                            <Label>Form Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={generatedUrl}
                                    readOnly
                                    className="font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This link expires in 72 hours. The patient does
                                not need an account.
                            </p>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="flex-1"
                            >
                                Generate Another
                            </Button>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
