"use node";

import { ConvexError } from "convex/values";
import type { FormLanguage } from "../../lib/validation/dental-form";

function normalizeConfiguredHost(hostOrUrl: string | undefined) {
    if (!hostOrUrl) return null;

    const trimmed = hostOrUrl.trim();
    if (!trimmed) return null;

    try {
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return new URL(trimmed).host.toLowerCase();
        }
    } catch {
        throw new ConvexError({
            code: "CONFIGURATION_ERROR",
            message: "Tenant root domain must be a valid host or absolute URL",
        });
    }

    return trimmed.toLowerCase();
}

function isLocalHost(host: string) {
    return (
        host.startsWith("localhost") ||
        host.startsWith("127.0.0.1") ||
        host.endsWith(".localhost") ||
        host.includes("lvh.me")
    );
}

function getPatientFormTenantOrigin(clientSlug: string): string {
    const tenantRootDomain = normalizeConfiguredHost(
        process.env.TENANT_ROOT_DOMAIN ??
            process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN,
    );

    if (!tenantRootDomain) {
        throw new ConvexError({
            code: "CONFIGURATION_ERROR",
            message:
                "Missing TENANT_ROOT_DOMAIN or NEXT_PUBLIC_TENANT_ROOT_DOMAIN for patient form links",
        });
    }

    const protocol = isLocalHost(tenantRootDomain) ? "http" : "https";
    return `${protocol}://${clientSlug}.${tenantRootDomain}`;
}

export function buildPatientFormUrl(
    token: string,
    clientSlug: string,
    preferredLanguage?: FormLanguage,
): string {
    const languageQuery =
        !preferredLanguage || preferredLanguage === "en"
            ? ""
            : `?lang=${preferredLanguage}`;

    return `${getPatientFormTenantOrigin(clientSlug)}/form/${token}${languageQuery}`;
}
