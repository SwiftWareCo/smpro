"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import type { FormLanguage } from "@/lib/patient-form-i18n";
import { PATIENT_FORM_COPY } from "@/lib/patient-form-i18n";

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    language: FormLanguage;
    placeholder?: string;
    forceLtr?: boolean;
}

const GOOGLE_LOCALE_MAP: Record<FormLanguage, string> = {
    en: "en",
    es: "es",
    ar: "ar",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW",
};

// BC bounding box
const BC_BOUNDS = {
    south: 48.3,
    west: -139.1,
    north: 60.0,
    east: -114.0,
};

const DEBOUNCE_MS = 300;
const UNIT_SEPARATOR = " — ";

function parseUnitAndAddress(combined: string): {
    unit: string;
    address: string;
} {
    const sepIndex = combined.indexOf(UNIT_SEPARATOR);
    if (sepIndex === -1) return { unit: "", address: combined };
    const beforeSep = combined.slice(0, sepIndex).trim();
    const afterSep = combined.slice(sepIndex + UNIT_SEPARATOR.length).trim();
    // Only treat it as a unit prefix if it looks like "Unit XXX"
    if (/^(Unit|Apt|Suite|#)\s/i.test(beforeSep)) {
        return {
            unit: beforeSep.replace(/^(Unit|Apt|Suite|#)\s*/i, ""),
            address: afterSep,
        };
    }
    return { unit: "", address: combined };
}

function combineUnitAndAddress(unit: string, address: string): string {
    if (!unit.trim()) return address;
    return `Unit ${unit.trim()}${UNIT_SEPARATOR}${address}`;
}

export function AddressAutocomplete({
    value,
    onChange,
    language,
    placeholder,
    forceLtr = false,
}: AddressAutocompleteProps) {
    const instanceId = useId();
    const listboxId = `address-listbox-${instanceId}`;
    const copy = PATIENT_FORM_COPY[language];

    const parsed = parseUnitAndAddress(value);
    const [inputValue, setInputValue] = useState(parsed.address);
    const [unitValue, setUnitValue] = useState(parsed.unit);
    const [suggestions, setSuggestions] = useState<
        google.maps.places.AutocompleteSuggestion[]
    >([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [fallback, setFallback] = useState(
        !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    );
    const [apiReady, setApiReady] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionTokenRef =
        useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Sync external value changes (e.g. form reset)
    useEffect(() => {
        const p = parseUnitAndAddress(value);
        setInputValue(p.address);
        setUnitValue(p.unit);
    }, [value]);

    // Load Places library
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setFallback(true);
            return;
        }

        let cancelled = false;

        setOptions({
            key: apiKey,
            language: GOOGLE_LOCALE_MAP[language],
        });

        importLibrary("places")
            .then(() => {
                if (cancelled) return;
                sessionTokenRef.current =
                    new google.maps.places.AutocompleteSessionToken();
                setApiReady(true);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                console.error("Google Places failed to load:", error);
                setFallback(true);
            });

        return () => {
            cancelled = true;
        };
        // Only run on mount — language won't change mid-form
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch suggestions with debounce
    const fetchSuggestions = useCallback(
        (input: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            if (!input.trim() || input.length < 3) {
                setSuggestions([]);
                setIsOpen(false);
                setActiveIndex(-1);
                return;
            }

            debounceRef.current = setTimeout(async () => {
                try {
                    const { suggestions: results } =
                        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
                            {
                                input,
                                includedRegionCodes: ["ca"],
                                locationRestriction: BC_BOUNDS,
                                sessionToken:
                                    sessionTokenRef.current ?? undefined,
                                language: GOOGLE_LOCALE_MAP[language],
                            },
                        );
                    setSuggestions(results);
                    setIsOpen(results.length > 0);
                    setActiveIndex(-1);
                } catch (error) {
                    console.error("Autocomplete fetch failed:", error);
                    setSuggestions([]);
                    setIsOpen(false);
                }
            }, DEBOUNCE_MS);
        },
        [language],
    );

    // Handle selecting a suggestion
    const selectSuggestion = useCallback(
        async (suggestion: google.maps.places.AutocompleteSuggestion) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return;

            try {
                const place = prediction.toPlace();
                await place.fetchFields({
                    fields: ["formattedAddress", "addressComponents"],
                });

                let finalAddress = place.formattedAddress ?? "";

                // Extract postal code from addressComponents
                const postalComponent = place.addressComponents?.find((c) =>
                    c.types.includes("postal_code"),
                );

                if (
                    postalComponent &&
                    !finalAddress.includes(postalComponent.longText ?? "")
                ) {
                    finalAddress = `${finalAddress}, ${postalComponent.longText}`;
                }

                setInputValue(finalAddress);
                onChangeRef.current(
                    combineUnitAndAddress(unitValue, finalAddress),
                );
            } catch (error) {
                console.error("Place details fetch failed:", error);
                // Fall back to prediction text
                const text = prediction.text?.text ?? "";
                setInputValue(text);
                onChangeRef.current(combineUnitAndAddress(unitValue, text));
            }

            // End session — create new token for next session
            sessionTokenRef.current =
                new google.maps.places.AutocompleteSessionToken();
            setSuggestions([]);
            setIsOpen(false);
            setActiveIndex(-1);
        },
        [unitValue],
    );

    // Click outside handler
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChangeRef.current(combineUnitAndAddress(unitValue, val));

        if (apiReady) {
            fetchSuggestions(val);
        }
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUnitValue(val);
        onChangeRef.current(combineUnitAndAddress(val, inputValue));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1,
                );
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    selectSuggestion(suggestions[activeIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                setActiveIndex(-1);
                break;
        }
    };

    if (fallback) {
        return (
            <div className="space-y-2">
                <Input
                    value={parsed.address}
                    onChange={(e) =>
                        onChange(
                            combineUnitAndAddress(parsed.unit, e.target.value),
                        )
                    }
                    placeholder={placeholder}
                    dir={forceLtr ? "ltr" : undefined}
                    className={
                        forceLtr ? "text-left [direction:ltr]" : undefined
                    }
                />
                <Input
                    value={parsed.unit}
                    onChange={(e) =>
                        onChange(
                            combineUnitAndAddress(
                                e.target.value,
                                parsed.address,
                            ),
                        )
                    }
                    placeholder={copy.unitPlaceholder}
                    dir={forceLtr ? "ltr" : undefined}
                    className={
                        forceLtr ? "text-left [direction:ltr]" : undefined
                    }
                />
            </div>
        );
    }

    const activeDescendant =
        activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

    return (
        <div ref={containerRef} className="relative space-y-2">
            <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (suggestions.length > 0) setIsOpen(true);
                }}
                placeholder={placeholder}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                aria-autocomplete="list"
                autoComplete="off"
                dir={forceLtr ? "ltr" : undefined}
                className={forceLtr ? "text-left [direction:ltr]" : undefined}
            />

            <Input
                value={unitValue}
                onChange={handleUnitChange}
                placeholder={copy.unitPlaceholder}
                autoComplete="off"
                dir={forceLtr ? "ltr" : undefined}
                className={forceLtr ? "text-left [direction:ltr]" : undefined}
            />

            {isOpen && suggestions.length > 0 && (
                <div
                    id={listboxId}
                    role="listbox"
                    className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
                    style={{
                        top: inputRef.current
                            ? inputRef.current.offsetHeight + 4
                            : undefined,
                    }}
                >
                    {suggestions.map((suggestion, index) => {
                        const prediction = suggestion.placePrediction;
                        if (!prediction) return null;

                        const mainText = prediction.mainText?.text ?? "";
                        const secondaryText =
                            prediction.secondaryText?.text ?? "";
                        const isActive = index === activeIndex;
                        const optionId = `${listboxId}-option-${index}`;

                        return (
                            <div
                                key={optionId}
                                id={optionId}
                                role="option"
                                aria-selected={isActive}
                                className={`cursor-pointer px-3 py-2 ${
                                    isActive
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50"
                                }`}
                                onMouseDown={(e) => {
                                    // Prevent input blur before selection
                                    e.preventDefault();
                                    selectSuggestion(suggestion);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <span className="font-medium">{mainText}</span>
                                {secondaryText && (
                                    <span className="ml-1.5 text-sm text-muted-foreground">
                                        {secondaryText}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
