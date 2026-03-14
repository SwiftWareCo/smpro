import type { CSSProperties } from "react";
import {
    DEFAULT_PORTAL_PRIMARY_COLOR,
    DEFAULT_PORTAL_SECONDARY_COLOR,
} from "@/lib/validation/client-onboarding";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

type RgbColor = { r: number; g: number; b: number };

const SURFACE_BASE = "#ffffff";
const CANVAS_BASE = "#f8fafc";
const FOREGROUND_BASE = "#0f172a";
const MUTED_FOREGROUND_BASE = "#475569";
const BORDER_BASE = "#cbd5e1";

export interface TenantThemePalette {
    background: string;
    foreground: string;
    card: string;
    popover: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
}

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
    const palette = resolveTenantThemePalette(input);

    return {
        "--background": palette.background,
        "--foreground": palette.foreground,
        "--card": palette.card,
        "--card-foreground": palette.foreground,
        "--popover": palette.popover,
        "--popover-foreground": palette.foreground,
        "--primary": palette.primary,
        "--primary-foreground": palette.primaryForeground,
        "--secondary": palette.secondary,
        "--secondary-foreground": palette.secondaryForeground,
        "--muted": palette.muted,
        "--muted-foreground": palette.mutedForeground,
        "--accent": palette.accent,
        "--accent-foreground": palette.accentForeground,
        "--border": palette.border,
        "--input": palette.input,
        "--ring": palette.ring,
        "--sidebar": palette.sidebar,
        "--sidebar-foreground": palette.sidebarForeground,
        "--sidebar-primary": palette.sidebarPrimary,
        "--sidebar-primary-foreground": palette.sidebarPrimaryForeground,
        "--sidebar-accent": palette.sidebarAccent,
        "--sidebar-accent-foreground": palette.sidebarAccentForeground,
        "--sidebar-border": palette.sidebarBorder,
        "--sidebar-ring": palette.sidebarRing,
    } as CSSProperties;
}

export function resolveTenantThemePalette(input: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
}): TenantThemePalette {
    const primary = normalizeThemeColor(
        input.primaryColor,
        DEFAULT_PORTAL_PRIMARY_COLOR,
    );
    const secondary = normalizeThemeColor(
        input.secondaryColor,
        DEFAULT_PORTAL_SECONDARY_COLOR,
    );
    const primaryForeground = getReadableTextColor(primary);
    const background = mixHex(secondary, CANVAS_BASE, 0.34);
    const card = mixHex(secondary, SURFACE_BASE, 0.12);
    const popover = SURFACE_BASE;
    const secondarySurface = mixHex(primary, secondary, 0.18);
    const accent = mixHex(primary, SURFACE_BASE, 0.16);
    const muted = mixHex(secondary, CANVAS_BASE, 0.42);
    const border = mixHex(BORDER_BASE, primary, 0.66);
    const inputColor = SURFACE_BASE;
    const sidebar = mixHex(primary, CANVAS_BASE, 0.14);
    const sidebarAccent = mixHex(primary, SURFACE_BASE, 0.2);

    return {
        background,
        foreground: FOREGROUND_BASE,
        card,
        popover,
        primary,
        primaryForeground,
        secondary: secondarySurface,
        secondaryForeground: FOREGROUND_BASE,
        muted,
        mutedForeground: MUTED_FOREGROUND_BASE,
        accent,
        accentForeground: FOREGROUND_BASE,
        border,
        input: inputColor,
        ring: primary,
        sidebar,
        sidebarForeground: FOREGROUND_BASE,
        sidebarPrimary: primary,
        sidebarPrimaryForeground: primaryForeground,
        sidebarAccent,
        sidebarAccentForeground: FOREGROUND_BASE,
        sidebarBorder: border,
        sidebarRing: primary,
    };
}
