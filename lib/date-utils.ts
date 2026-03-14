import { format, isValid, parseISO } from "date-fns";

function toDate(value: Date | number | string): Date {
    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "number") {
        return new Date(value);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return parseISO(`${value}T00:00:00`);
    }

    return parseISO(value);
}

export function formatProjectDate(
    value: Date | number | string | null | undefined,
): string {
    if (value == null) {
        return "";
    }

    const date = toDate(value);
    if (!isValid(date)) {
        return "";
    }

    return format(date, "MMM d, yyyy");
}
