"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
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
import { Copy, Loader2, Link, Mail, Smartphone, QrCode } from "lucide-react";
import type { DeliveryChannel } from "@/lib/validation/dental-form";

interface DeliveryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: Id<"clients">;
    template: Doc<"formTemplates">;
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
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [generating, setGenerating] = useState(false);

    const createLink = useAction(api.formDeliveriesActions.createLink);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const result = await createLink({
                clientId,
                templateId: template._id,
                channel,
            });

            setGeneratedUrl(result.formUrl);
            toast.success("Form link generated");
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

    const handleReset = () => {
        setGeneratedUrl("");
        setPatientName("");
        setRecipientEmail("");
        setRecipientPhone("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Send Form to Patient</DialogTitle>
                    <DialogDescription>
                        Generate a secure link for &quot;{template.name}&quot;.
                        Links expire after 72 hours.
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
                                "Generate Form Link"
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
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

                        {channel === "email" && (
                            <p className="text-sm text-muted-foreground">
                                Email delivery is not yet configured. Please
                                copy and send the link manually for now.
                            </p>
                        )}

                        {channel === "sms" && (
                            <p className="text-sm text-muted-foreground">
                                SMS delivery is not yet configured. Please copy
                                and send the link manually for now.
                            </p>
                        )}

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
