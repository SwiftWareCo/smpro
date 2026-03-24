interface MultipleChoiceFieldLike {
    options?: string[];
    placeholder?: string;
}

interface FollowUpParentFieldLike {
    type: string;
}

export function getMultipleChoiceOptions(
    field: MultipleChoiceFieldLike,
): string[] {
    const explicitOptions = (field.options ?? [])
        .map((option) => option.trim())
        .filter(Boolean);

    if (explicitOptions.length > 0) {
        return explicitOptions;
    }

    const fallbackOption = field.placeholder?.trim();
    return fallbackOption ? [fallbackOption] : [];
}

export function parseMultipleChoiceValue(value: string): string[] {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(normalizedValue);
        if (Array.isArray(parsed)) {
            return Array.from(
                new Set(
                    parsed
                        .filter(
                            (item): item is string => typeof item === "string",
                        )
                        .map((item) => item.trim())
                        .filter(Boolean),
                ),
            );
        }
    } catch {
        // Legacy submissions may still contain a plain string value.
    }

    return [normalizedValue];
}

export function serializeMultipleChoiceValue(values: string[]): string {
    const normalizedValues = Array.from(
        new Set(values.map((value) => value.trim()).filter(Boolean)),
    );

    return normalizedValues.length > 0 ? JSON.stringify(normalizedValues) : "";
}

export function matchesFollowUpTrigger(
    parentField: FollowUpParentFieldLike,
    triggers: string[],
    parentValue: string,
): boolean {
    if (triggers.length === 0) return false;

    if (triggers.includes("__any__")) {
        return parentValue.trim().length > 0;
    }

    if (parentField.type === "multiSelect") {
        const selected = parseMultipleChoiceValue(parentValue);
        return triggers.some((t) => selected.includes(t));
    }

    return triggers.includes(parentValue);
}
