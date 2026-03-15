"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    Clock,
    Trash2,
    User,
} from "lucide-react";
import type { DeliveryChannel } from "@/lib/validation/dental-form";
import { formatProjectDate } from "@/lib/date-utils";

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

const channelIcons: Record<DeliveryChannel, React.ReactNode> = {
    link: <Link className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    sms: <Smartphone className="h-3.5 w-3.5" />,
    qr: <QrCode className="h-3.5 w-3.5" />,
    tablet: <QrCode className="h-3.5 w-3.5" />,
};

const buttonLabels: Record<DeliveryChannel, string> = {
    link: "Generate Form Link",
    email: "Generate & Send Email",
    qr: "Generate QR Code",
    sms: "Generate Form Link",
    tablet: "Generate Form Link",
};

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    opened: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    expired: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

async function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch {
            // Clipboard API rejected — fall through to execCommand fallback
        }
    }
    // Fallback: insert a temporary input *inside* the dialog so Radix's
    // focus-trap doesn't steal focus away before execCommand can fire.
    const container =
        document.activeElement?.closest<HTMLElement>("[role=dialog]") ??
        document.body;
    const el = document.createElement("input");
    el.value = text;
    el.style.cssText = "position:absolute;opacity:0;pointer-events:none";
    container.appendChild(el);
    el.select();
    try {
        if (!document.execCommand("copy")) {
            throw new Error("Copy failed");
        }
    } finally {
        container.removeChild(el);
    }
}

export function DeliveryDialog({
    open,
    onOpenChange,
    clientId,
    template,
}: DeliveryDialogProps) {
    const [channel, setChannel] = useState<DeliveryChannel>("link");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [patientName, setPatientName] = useState("");
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
    const revokeDelivery = useMutation(api.formDeliveries.revoke);

    // Keep a stable template reference for the query during the close animation.
    // When `open` flips to false, the query would immediately skip and return
    // undefined — causing the history list to unmount before the fade-out finishes.
    const [queryTemplate, setQueryTemplate] = useState<Doc<"formTemplates"> | null>(null);

    useEffect(() => {
        if (open && template) {
            setQueryTemplate(template);
        }
        if (!open) {
            const timer = setTimeout(() => {
                setQueryTemplate(null);
                setGeneratedUrl("");
                setRecipientEmail("");
                setRecipientPhone("");
                setPatientName("");
                setChannel("link");
                setGenerating(false);
                setEmailSending(false);
                setEmailSent(false);
                setEmailError(false);
                setDeliveryResult(null);
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [open, template]);

    const deliveryHistory = useQuery(
        api.formDeliveries.listForTemplate,
        queryTemplate ? { clientId, templateId: queryTemplate._id } : "skip",
    );

    const buildFormUrl = useCallback((token: string) => {
        return `${window.location.origin}/form/${token}`;
    }, []);

    const handleCopyUrl = useCallback(async (url: string) => {
        try {
            await copyToClipboard(url);
            toast.success("Link copied to clipboard");
        } catch {
            toast.error("Failed to copy link");
        }
    }, []);

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
                patientName: patientName.trim() || undefined,
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
        setRecipientEmail("");
        setRecipientPhone("");
        setPatientName("");
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

                {generatedUrl ? (
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
                                    onClick={() =>
                                        void handleCopyUrl(generatedUrl)
                                    }
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
                ) : (
                    <div className="space-y-4">
                        {/* Generate form */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="patient-name">
                                    Patient Name (optional)
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="patient-name"
                                        value={patientName}
                                        onChange={(e) =>
                                            setPatientName(e.target.value)
                                        }
                                        placeholder="e.g. Jane Smith"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

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

                        {/* Delivery history */}
                        {deliveryHistory && deliveryHistory.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Delivery History
                                    </Label>
                                    <ScrollArea className="max-h-48">
                                        <div className="space-y-2 pr-3">
                                        {deliveryHistory.map((d) => {
                                            const now = Date.now();
                                            const isExpired =
                                                d.tokenExpiresAt < now;
                                            const isTerminal =
                                                d.status === "completed" ||
                                                d.status === "expired" ||
                                                d.status === "failed";
                                            const url = buildFormUrl(d.token);

                                            return (
                                                <div
                                                    key={d.deliveryId}
                                                    className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {channelIcons[d.channel]}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate">
                                                        {d.patientName || "—"}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${statusColors[d.status] ?? ""}`}
                                                    >
                                                        {d.status}
                                                    </Badge>
                                                    <span className="shrink-0 text-muted-foreground">
                                                        {formatProjectDate(
                                                            d.createdAt,
                                                        )}
                                                    </span>
                                                    {isExpired && !isTerminal && (
                                                        <span className="shrink-0 text-[10px] text-destructive">
                                                            Expired
                                                        </span>
                                                    )}
                                                    {!isExpired &&
                                                        !isTerminal && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0"
                                                                    onClick={() =>
                                                                        void handleCopyUrl(
                                                                            url,
                                                                        )
                                                                    }
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await revokeDelivery({ deliveryId: d.deliveryId });
                                                                            toast.success("Link revoked");
                                                                        } catch {
                                                                            toast.error("Failed to revoke link");
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </>
                                                        )}
                                                </div>
                                            );
                                        })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
