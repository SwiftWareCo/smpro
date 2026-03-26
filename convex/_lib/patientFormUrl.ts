"use node";

import { ConvexError } from "convex/values";
import type { FormLanguage } from "../../lib/validation/dental-form";

function getAppOrigin(): string | null {
    const appUrl =
        process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
    if (!appUrl) {
        return null;
    }
    // Strip trailing slash
    return appUrl.replace(/\/+$/, "");
}

export function buildPatientFormUrl(
    token: string,
    _clientSlug: string,
    preferredLanguage?: FormLanguage,
    options?: { requireAbsolute?: boolean },
): string {
    const languageQuery =
        !preferredLanguage || preferredLanguage === "en"
            ? ""
            : `?lang=${preferredLanguage}`;
    const path = `/form/${token}${languageQuery}`;
    const origin = getAppOrigin();

    if (!origin) {
        if (options?.requireAbsolute) {
            throw new ConvexError({
                code: "CONFIGURATION_ERROR",
                message:
                    "Missing NEXT_PUBLIC_APP_URL for absolute patient form links",
            });
        }
        return path;
    }

    return `${origin}${path}`;
}
