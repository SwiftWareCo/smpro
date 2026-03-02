import { z } from "zod";

export const DEFAULT_PORTAL_PRIMARY_COLOR = "#7dd3fc";
export const DEFAULT_PORTAL_SECONDARY_COLOR = "#ffffff";

export const RESERVED_CLIENT_SLUGS = new Set([
    "admin",
    "api",
    "app",
    "dashboard",
    "help",
    "root",
    "settings",
    "support",
    "www",
]);

const clientSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern = /^#(?:[0-9a-fA-F]{6})$/;

function isReservedSlug(slug: string) {
    return RESERVED_CLIENT_SLUGS.has(slug);
}

const baseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Client name must be at least 2 characters")
        .max(80, "Client name must be 80 characters or fewer"),
    description: z
        .string()
        .trim()
        .max(240, "Description must be 240 characters or fewer")
        .optional()
        .default(""),
    slug: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, "Slug must be at least 3 characters")
        .max(48, "Slug must be 48 characters or fewer")
        .regex(
            clientSlugPattern,
            "Slug must use lowercase letters, numbers, and single hyphens",
        )
        .refine((value) => !isReservedSlug(value), {
            message: "Slug is reserved. Please choose another one",
        }),
    adminEmail: z
        .string()
        .trim()
        .email("Enter a valid admin email address")
        .transform((value) => value.toLowerCase()),
    adminPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be 128 characters or fewer")
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[0-9]/, "Password must include a number"),
    portalPrimaryColor: z
        .string()
        .trim()
        .regex(hexColorPattern, "Primary color must be a hex code like #1a73e8"),
    portalSecondaryColor: z
        .string()
        .trim()
        .regex(
            hexColorPattern,
            "Secondary color must be a hex code like #ffffff",
        ),
});

export const clientOnboardingFormSchema = baseSchema;

export const clientOnboardingRequestSchema = baseSchema.transform((data) => ({
    ...data,
    description: data.description || undefined,
}));

export type ClientOnboardingFormData = z.input<typeof clientOnboardingFormSchema>;
export type ClientOnboardingRequest = z.output<
    typeof clientOnboardingRequestSchema
>;
