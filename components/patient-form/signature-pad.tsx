"use client";

import { useState, type CSSProperties } from "react";
import { PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
    label: string;
    required: boolean;
    value: string;
    onChange: (value: string) => void;
    dialogClassName?: string;
    dialogStyle?: CSSProperties;
}

const SIGNATURE_FONT_STYLE: CSSProperties = {
    fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
};

export function SignaturePad({
    label,
    required,
    value,
    onChange,
    dialogClassName,
    dialogStyle,
}: SignaturePadProps) {
    const [open, setOpen] = useState(false);
    const [typedName, setTypedName] = useState(value);

    const openDialog = () => {
        setTypedName(value);
        setOpen(true);
    };

    const saveSignature = () => {
        const normalized = typedName.trim();
        if (!normalized) return;
        onChange(normalized);
        setOpen(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <Label>
                    {label}
                    {required && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </Label>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onChange("")}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            <button
                type="button"
                onClick={openDialog}
                className="w-full rounded-md border border-dashed bg-white p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            >
                {value ? (
                    <p
                        className="min-h-10 text-3xl leading-tight text-slate-900"
                        style={SIGNATURE_FONT_STYLE}
                    >
                        {value}
                    </p>
                ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PenLine className="h-3.5 w-3.5" />
                        Tap to sign
                    </p>
                )}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={cn("force-light sm:max-w-md", dialogClassName)}
                    style={dialogStyle}
                >
                    <DialogHeader>
                        <DialogTitle>Type your signature</DialogTitle>
                        <DialogDescription>
                            Enter your full legal name exactly as you want it
                            signed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            value={typedName}
                            onChange={(event) =>
                                setTypedName(event.target.value)
                            }
                            placeholder="Full name"
                            autoFocus
                        />
                        <div className="rounded-md border bg-muted/20 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Preview
                            </p>
                            <p
                                className="mt-1 min-h-10 text-3xl leading-tight text-slate-900"
                                style={SIGNATURE_FONT_STYLE}
                            >
                                {typedName.trim() || "Your signature"}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={saveSignature}
                            disabled={!typedName.trim()}
                        >
                            Use Signature
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
