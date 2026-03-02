function getProtocol() {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return new URL(process.env.NEXT_PUBLIC_APP_URL).protocol;
    }
    if (typeof window !== "undefined") {
        return window.location.protocol;
    }
    return "https:";
}

export function getClientPortalUrl(slug: string) {
    const tenantRootDomain = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const protocol = getProtocol();

    if (tenantRootDomain) {
        return `${protocol}//${slug}.${tenantRootDomain}`;
    }

    if (typeof window !== "undefined") {
        return `${window.location.protocol}//${slug}.${window.location.host}`;
    }

    return `${protocol}//${slug}.example.com`;
}
