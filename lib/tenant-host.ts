const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SUBDOMAIN_LABELS = new Set([
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

function normalizeHost(host: string) {
    return host.trim().toLowerCase().replace(/\.$/, "");
}

function parseHostParts(host: string | null) {
    if (!host) return null;

    const normalized = normalizeHost(host.split(",")[0] ?? "");
    if (!normalized) return null;

    try {
        const parsed = new URL(`http://${normalized}`);
        return {
            hostname: parsed.hostname.toLowerCase(),
            port: parsed.port || null,
        };
    } catch {
        return null;
    }
}

function normalizeConfiguredHost(hostOrUrl: string | undefined) {
    if (!hostOrUrl) return null;

    const trimmed = hostOrUrl.trim();
    if (!trimmed) return null;

    try {
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return normalizeHost(new URL(trimmed).host);
        }
    } catch {
        return null;
    }

    return normalizeHost(trimmed);
}

function isLocalHost(domain: string | null) {
    if (!domain) return false;
    return (
        domain.startsWith("localhost") ||
        domain.startsWith("127.0.0.1") ||
        domain.endsWith(".localhost") ||
        domain.includes("lvh.me")
    );
}

export function getTenantRootDomain() {
    return normalizeConfiguredHost(
        process.env.TENANT_ROOT_DOMAIN ??
            process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN,
    );
}

export function getAppRootDomain() {
    return normalizeConfiguredHost(
        process.env.APP_ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_APP_URL,
    );
}

export function resolveTenantSlugFromHost(
    host: string | null,
    tenantRootDomain?: string | null | undefined,
) {
    const configuredTenantRootDomain =
        tenantRootDomain ??
        process.env.TENANT_ROOT_DOMAIN ??
        process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;

    const parsedHost = parseHostParts(host);
    const parsedTenantRoot = parseHostParts(
        normalizeConfiguredHost(configuredTenantRootDomain ?? undefined),
    );

    if (!parsedHost || !parsedTenantRoot) {
        return null;
    }

    if (
        parsedTenantRoot.port &&
        parsedHost.port &&
        parsedTenantRoot.port !== parsedHost.port
    ) {
        return null;
    }

    if (!parsedHost.hostname.endsWith(`.${parsedTenantRoot.hostname}`)) {
        return null;
    }

    const slug = parsedHost.hostname.slice(
        0,
        parsedHost.hostname.length - parsedTenantRoot.hostname.length - 1,
    );

    if (!slug || slug.includes(".") || !TENANT_SLUG_PATTERN.test(slug)) {
        return null;
    }

    if (RESERVED_SUBDOMAIN_LABELS.has(slug)) {
        return null;
    }

    return slug;
}

export function getRequestHost(headers: Headers) {
    const rawHost = headers.get("x-forwarded-host") ?? headers.get("host");
    return rawHost ? normalizeHost(rawHost.split(",")[0] ?? "") : null;
}

export function getRequestProtocol(headers: Headers): "http" | "https" {
    const forwardedProto = headers
        .get("x-forwarded-proto")
        ?.split(",")[0]
        ?.trim()
        ?.toLowerCase();

    if (forwardedProto === "http" || forwardedProto === "https") {
        return forwardedProto;
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        try {
            const protocol = new URL(process.env.NEXT_PUBLIC_APP_URL).protocol;
            if (protocol === "http:" || protocol === "https:") {
                return protocol.replace(":", "") as "http" | "https";
            }
        } catch {
            // Fall back below.
        }
    }

    const tenantRootDomain = getTenantRootDomain();
    const appRootDomain = getAppRootDomain();
    return isLocalHost(tenantRootDomain) || isLocalHost(appRootDomain)
        ? "http"
        : "https";
}

export function buildTenantPortalUrl(slug: string, protocol: "http" | "https") {
    const tenantRootDomain = getTenantRootDomain();
    if (!tenantRootDomain) {
        return `/${slug}`;
    }
    return `${protocol}://${slug}.${tenantRootDomain}`;
}

export function buildAppUrl(protocol: "http" | "https") {
    const appRootDomain = getAppRootDomain();
    if (!appRootDomain) {
        return "/";
    }
    return `${protocol}://${appRootDomain}`;
}
