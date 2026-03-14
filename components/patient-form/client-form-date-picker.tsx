"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FormLanguage } from "@/lib/patient-form-i18n";

interface ClientFormDatePickerProps {
    value: string;
    onChange: (value: string) => void;
    language: FormLanguage;
    placeholder?: string;
}

type Step = "year" | "month" | "day";

const COPY: Record<
    FormLanguage,
    {
        placeholder: string;
        pickYear: string;
        pickMonth: string;
        pickDay: string;
        back: string;
    }
> = {
    en: {
        placeholder: "Select date",
        pickYear: "Select year",
        pickMonth: "Select month",
        pickDay: "Select day",
        back: "Back",
    },
    es: {
        placeholder: "Seleccionar fecha",
        pickYear: "Seleccionar año",
        pickMonth: "Seleccionar mes",
        pickDay: "Seleccionar día",
        back: "Atrás",
    },
    ar: {
        placeholder: "اختر التاريخ",
        pickYear: "اختر السنة",
        pickMonth: "اختر الشهر",
        pickDay: "اختر اليوم",
        back: "رجوع",
    },
    "zh-Hans": {
        placeholder: "选择日期",
        pickYear: "选择年份",
        pickMonth: "选择月份",
        pickDay: "选择日期",
        back: "返回",
    },
    "zh-Hant": {
        placeholder: "選擇日期",
        pickYear: "選擇年份",
        pickMonth: "選擇月份",
        pickDay: "選擇日期",
        back: "返回",
    },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_COLS = 4;

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

export function ClientFormDatePicker({
    value,
    onChange,
    language,
    placeholder,
}: ClientFormDatePickerProps) {
    const copy = COPY[language];
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("year");
    const [pickedYear, setPickedYear] = useState<number | null>(null);
    const [pickedMonth, setPickedMonth] = useState<number | null>(null);
    const yearGridRef = useRef<HTMLDivElement>(null);

    const monthNames = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) =>
                new Intl.DateTimeFormat(language, { month: "long" }).format(
                    new Date(2000, i),
                ),
            ),
        [language],
    );

    const monthNamesShort = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) =>
                new Intl.DateTimeFormat(language, { month: "short" }).format(
                    new Date(2000, i),
                ),
            ),
        [language],
    );

    // Parse existing value
    const parsed = useMemo(() => {
        if (!value) return null;
        const [y, m, d] = value.split("-").map(Number);
        if (!y || !m || !d) return null;
        return { year: y, month: m, day: d };
    }, [value]);

    // Display string for the trigger
    const displayValue = useMemo(() => {
        if (!parsed) return null;
        try {
            return new Intl.DateTimeFormat(language, {
                year: "numeric",
                month: "long",
                day: "numeric",
            }).format(new Date(parsed.year, parsed.month - 1, parsed.day));
        } catch {
            return value;
        }
    }, [parsed, language, value]);

    // Reset step state when popover opens
    useEffect(() => {
        if (open) {
            if (parsed) {
                setPickedYear(parsed.year);
                setPickedMonth(parsed.month);
                setStep("day");
            } else {
                setPickedYear(null);
                setPickedMonth(null);
                setStep("year");
            }
        }
    }, [open, parsed]);

    // Scroll year grid to show a reasonable range on open
    useEffect(() => {
        if (open && step === "year" && yearGridRef.current) {
            const targetYear = parsed?.year ?? 1990;
            const rowIndex = Math.floor(
                (CURRENT_YEAR - targetYear) / YEAR_COLS,
            );
            const rowHeight = 36;
            const scrollTo = Math.max(0, rowIndex * rowHeight - rowHeight * 2);
            yearGridRef.current.scrollTop = scrollTo;
        }
    }, [open, step, parsed?.year]);

    const goBack = useCallback(() => {
        if (step === "month") {
            setPickedYear(null);
            setStep("year");
        } else if (step === "day") {
            setPickedMonth(null);
            setStep("month");
        }
    }, [step]);

    const selectYear = useCallback((y: number) => {
        setPickedYear(y);
        setStep("month");
    }, []);

    const selectMonth = useCallback((m: number) => {
        setPickedMonth(m);
        setStep("day");
    }, []);

    const selectDay = useCallback(
        (d: number) => {
            if (pickedYear == null || pickedMonth == null) return;
            const iso = `${pickedYear}-${String(pickedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            onChange(iso);
            setOpen(false);
        },
        [pickedYear, pickedMonth, onChange],
    );

    // Build years array (descending)
    const years = useMemo(() => {
        const items: number[] = [];
        for (let y = CURRENT_YEAR; y >= 1900; y--) {
            items.push(y);
        }
        return items;
    }, []);

    // Build days grid
    const daysGrid = useMemo(() => {
        if (pickedYear == null || pickedMonth == null) return [];
        const total = getDaysInMonth(pickedYear, pickedMonth);
        // Day of week for the 1st (0=Sun)
        const firstDow = new Date(pickedYear, pickedMonth - 1, 1).getDay();
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDow; i++) cells.push(null);
        for (let d = 1; d <= total; d++) cells.push(d);
        return cells;
    }, [pickedYear, pickedMonth]);

    // Jan 7 2024 is a Sunday — use it as anchor for Sun-start week headers
    const dowHeadersSunStart = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) =>
                new Intl.DateTimeFormat(language, { weekday: "narrow" }).format(
                    new Date(2024, 0, 7 + i),
                ),
            ),
        [language],
    );

    const stepTitle =
        step === "year"
            ? copy.pickYear
            : step === "month"
              ? `${pickedYear} — ${copy.pickMonth}`
              : `${monthNamesShort[pickedMonth! - 1]} ${pickedYear}`;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors",
                        "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        !displayValue && "text-muted-foreground",
                    )}
                >
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                        {displayValue ?? placeholder ?? copy.placeholder}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                {/* Header */}
                <div className="flex items-center gap-2 border-b px-3 py-2">
                    {step !== "year" && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={goBack}
                            className="shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">{copy.back}</span>
                        </Button>
                    )}
                    <p className="text-sm font-medium">{stepTitle}</p>
                </div>

                {/* Year grid */}
                {step === "year" && (
                    <div
                        ref={yearGridRef}
                        className="grid max-h-[252px] grid-cols-4 gap-1 overflow-y-auto p-2"
                    >
                        {years.map((y) => (
                            <button
                                key={y}
                                type="button"
                                onClick={() => selectYear(y)}
                                className={cn(
                                    "rounded-md cursor-pointer px-1 py-1.5 text-sm transition-colors hover:bg-accent",
                                    parsed?.year === y &&
                                        "bg-primary text-primary-foreground hover:bg-primary/90",
                                )}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                )}

                {/* Month grid */}
                {step === "month" && (
                    <div className="grid grid-cols-3 gap-1 p-2">
                        {monthNames.map((name, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => selectMonth(i + 1)}
                                className={cn(
                                    "rounded-md cursor-pointer px-1 py-2 text-sm transition-colors hover:bg-accent",
                                    parsed?.month === i + 1 &&
                                        parsed.year === pickedYear &&
                                        "bg-primary text-primary-foreground hover:bg-primary/90",
                                )}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Day grid */}
                {step === "day" && (
                    <div className="p-2">
                        <div className="mb-1 grid grid-cols-7 text-center">
                            {dowHeadersSunStart.map((d, i) => (
                                <span
                                    key={i}
                                    className="py-1 text-xs font-medium text-muted-foreground"
                                >
                                    {d}
                                </span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                            {daysGrid.map((d, i) =>
                                d == null ? (
                                    <span key={`empty-${i}`} />
                                ) : (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => selectDay(d)}
                                        className={cn(
                                            "flex cursor-pointer h-8 w-full items-center justify-center rounded-md text-sm transition-colors hover:bg-accent",
                                            parsed?.day === d &&
                                                parsed.month === pickedMonth &&
                                                parsed.year === pickedYear &&
                                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                        )}
                                    >
                                        {d}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
