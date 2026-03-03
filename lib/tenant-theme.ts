import type { CSSProperties } from "react";
import {
    DEFAULT_PORTAL_PRIMARY_COLOR,
    DEFAULT_PORTAL_SECONDARY_COLOR,
} from "@/lib/validation/client-onboarding";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

type RgbColor = { r: number; g: number; b: number };

function normalizeThemeColor(
    color: string | null | undefined,
    fallbackColor: string,
) {
    if (!color) return fallbackColor;
    const value = color.trim();
    if (!HEX_COLOR_PATTERN.test(value)) return fallbackColor;
    if (value.length === 4) {
        const [_, r, g, b] = value;
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return value.toLowerCase();
}

function hexToRgb(hex: string): RgbColor {
    const value = hex.replace("#", "");
    return {
        r: Number.parseInt(value.slice(0, 2), 16),
        g: Number.parseInt(value.slice(2, 4), 16),
        b: Number.parseInt(value.slice(4, 6), 16),
    };
}

function rgbToHex(rgb: RgbColor) {
    return `#${[rgb.r, rgb.g, rgb.b]
        .map((component) =>
            Math.max(0, Math.min(255, Math.round(component)))
                .toString(16)
                .padStart(2, "0"),
        )
        .join("")}`;
}

function mixHex(colorA: string, colorB: string, ratioOfA: number) {
    const a = hexToRgb(colorA);
    const b = hexToRgb(colorB);
    const ratio = Math.max(0, Math.min(1, ratioOfA));
    return rgbToHex({
        r: a.r * ratio + b.r * (1 - ratio),
        g: a.g * ratio + b.g * (1 - ratio),
        b: a.b * ratio + b.b * (1 - ratio),
    });
}

function getReadableTextColor(backgroundHex: string) {
    const { r, g, b } = hexToRgb(backgroundHex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.58 ? "#0f172a" : "#f8fafc";
}

export function buildTenantThemeStyle(input: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
}): CSSProperties {
    const primary = normalizeThemeColor(
        input.primaryColor,
        DEFAULT_PORTAL_PRIMARY_COLOR,
    );
    const secondary = normalizeThemeColor(
        input.secondaryColor,
        DEFAULT_PORTAL_SECONDARY_COLOR,
    );
    const primaryForeground = getReadableTextColor(primary);
    const secondaryForeground = getReadableTextColor(secondary);
    const sidebarAccent = mixHex(primary, secondary, 0.14);
    const sidebarAccentForeground = getReadableTextColor(sidebarAccent);
    const border = mixHex(primary, secondary, 0.22);
    const muted = mixHex(primary, secondary, 0.1);
    const inputColor = mixHex(primary, secondary, 0.08);

    return {
        "--background": secondary,
        "--foreground": secondaryForeground,
        "--card": secondary,
        "--card-foreground": secondaryForeground,
        "--popover": secondary,
        "--popover-foreground": secondaryForeground,
        "--primary": primary,
        "--primary-foreground": primaryForeground,
        "--secondary": secondary,
        "--secondary-foreground": secondaryForeground,
        "--muted": muted,
        "--muted-foreground": secondaryForeground,
        "--accent": sidebarAccent,
        "--accent-foreground": sidebarAccentForeground,
        "--border": border,
        "--input": inputColor,
        "--ring": primary,
        "--sidebar": secondary,
        "--sidebar-foreground": secondaryForeground,
        "--sidebar-primary": primary,
        "--sidebar-primary-foreground": primaryForeground,
        "--sidebar-accent": sidebarAccent,
        "--sidebar-accent-foreground": sidebarAccentForeground,
        "--sidebar-border": border,
        "--sidebar-ring": primary,
    } as CSSProperties;
}
