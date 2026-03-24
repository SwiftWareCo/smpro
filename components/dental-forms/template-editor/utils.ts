import type {
    FieldType,
    FollowUpField,
    TemplateField,
} from "@/lib/validation/dental-form";

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Textbox" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Single Choice" },
    { value: "multiSelect", label: "Multiple Choice" },
    { value: "signature", label: "Signature" },
    { value: "address", label: "Address" },
    { value: "paragraph", label: "Paragraph" },
];

export const FOLLOW_UP_TYPES: {
    value: FollowUpField["type"];
    label: string;
}[] = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Textbox" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Single Choice" },
    { value: "multiSelect", label: "Multiple Choice" },
    { value: "paragraph", label: "Paragraph" },
];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = FIELD_TYPES.reduce(
    (labels, fieldType) => {
        labels[fieldType.value] = fieldType.label;
        return labels;
    },
    {} as Record<FieldType, string>,
);

export const FORMAT_PRESETS: {
    label: string;
    pattern: string;
    message: string;
}[] = [
    {
        label: "Numbers only",
        pattern: "^\\d+$",
        message: "Only numbers are allowed",
    },
    {
        label: "Letters only",
        pattern: "^[a-zA-Z\\s]+$",
        message: "Only letters are allowed",
    },
    {
        label: "No special characters",
        pattern: "^[a-zA-Z0-9\\s]+$",
        message: "Special characters are not allowed",
    },
    {
        label: "Phone number",
        pattern: "^\\+?[\\d\\s\\-()]{7,15}$",
        message: "Enter a valid phone number",
    },
    {
        label: "Postal code (Canada)",
        pattern: "^[A-Za-z]\\d[A-Za-z]\\s?\\d[A-Za-z]\\d$",
        message: "Enter a valid Canadian postal code (e.g. V6B 1A1)",
    },
    {
        label: "Zip code (US)",
        pattern: "^\\d{5}(-\\d{4})?$",
        message: "Enter a valid US zip code (e.g. 90210)",
    },
];

export const OPTION_PRESETS = [
    { label: "Yes / No", options: ["Yes", "No"] },
    { label: "Male / Female", options: ["Male", "Female"] },
    { label: "Daily / Weekly / Never", options: ["Daily", "Weekly", "Never"] },
] as const;

export const SECTION_ACTION_BUTTON_CLASS =
    "border-2 border-blue-500 bg-white text-slate-950 shadow-sm hover:border-blue-600 hover:bg-blue-50 hover:text-slate-950 dark:border-blue-400 dark:bg-white dark:text-slate-950 dark:hover:border-blue-300 dark:hover:bg-blue-50";

export const HIDDEN_SCROLLBAR_CLASS =
    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const HIDDEN_SCROLL_AREA_CLASS =
    "[&_[data-slot=scroll-area-scrollbar]]:hidden";

export function generateId(): string {
    return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDefaultOptions(fieldType: FieldType): string[] | undefined {
    if (fieldType === "radio") {
        return ["Option 1", "Option 2"];
    }
    if (fieldType === "select") {
        return ["Choice 1", "Choice 2"];
    }
    if (fieldType === "multiSelect") {
        return ["Option 1", "Option 2", "Option 3"];
    }
    return undefined;
}

export function getDefaultFieldLabel(fieldType: FieldType): string {
    if (fieldType === "radio") {
        return "New single choice";
    }
    if (fieldType === "select") {
        return "New dropdown";
    }
    if (fieldType === "multiSelect") {
        return "New multiple choice";
    }
    if (fieldType === "paragraph") {
        return "Enter paragraph text";
    }
    return "New field";
}

export function createField(fieldType: FieldType = "text"): TemplateField {
    return {
        id: generateId(),
        type: fieldType,
        label: "",
        required: false,
        placeholder: supportsPlaceholder(fieldType) ? "" : undefined,
        options: getDefaultOptions(fieldType),
        width: fieldType === "address" ? "full" : undefined,
        paragraphStyle:
            fieldType === "paragraph"
                ? {
                      fontSize: "base",
                      bold: false,
                  }
                : undefined,
    };
}

export function supportsPlaceholder(fieldType: FieldType): boolean {
    return ![
        "date",
        "select",
        "radio",
        "multiSelect",
        "signature",
        "address",
        "paragraph",
    ].includes(fieldType);
}

export function supportsOptions(fieldType: FieldType): boolean {
    return (
        fieldType === "select" ||
        fieldType === "radio" ||
        fieldType === "multiSelect"
    );
}

export function supportsValidation(fieldType: FieldType): boolean {
    return ["text", "textarea", "email", "phone", "number"].includes(fieldType);
}

export function supportsPattern(fieldType: FieldType): boolean {
    return ["text", "textarea", "email", "phone"].includes(fieldType);
}

export function supportsFollowUp(fieldType: FieldType): boolean {
    return fieldType !== "paragraph";
}

export function supportsRequired(fieldType: FieldType): boolean {
    return fieldType !== "paragraph";
}

export function isChoiceType(fieldType: string): boolean {
    return (
        fieldType === "radio" ||
        fieldType === "select" ||
        fieldType === "multiSelect"
    );
}

export function createFollowUp(parentField: TemplateField): FollowUpField {
    return {
        id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "text",
        label: "Please provide details",
        required: false,
        triggers: isChoiceType(parentField.type)
            ? [parentField.options?.[0] ?? "__any__"]
            : ["__any__"],
    };
}
