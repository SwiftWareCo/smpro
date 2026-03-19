import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { api } from "@/convex/_generated/api";

export type PortalModule = "patient_forms" | "knowledge_base";

function normalizeEnabledModules(
    enabledModules: string[] | null | undefined,
): string[] {
    return enabledModules ?? [];
}

export const getPortalTenant = cache(async () => {
    const requestHeaders = await headers();
    const tenantSlug = requestHeaders.get("x-tenant-slug");

    if (!tenantSlug) {
        notFound();
    }

    const { userId, getToken } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const token = (await getToken({ template: "convex" })) ?? undefined;
    const tenant = await fetchQuery(
        api.clients.getPortalBySlug,
        { slug: tenantSlug },
        { token },
    );

    if (!tenant || !tenant.clerkOrganizationId) {
        notFound();
    }

    return {
        ...tenant,
        enabledModules: normalizeEnabledModules(tenant.enabledModules),
    };
});

export function hasPortalModule(
    enabledModules: string[] | null | undefined,
    module: PortalModule,
) {
    return normalizeEnabledModules(enabledModules).includes(module);
}

export async function requirePortalModule(module: PortalModule) {
    const tenant = await getPortalTenant();
    if (!hasPortalModule(tenant.enabledModules, module)) {
        redirect("/");
    }
    return tenant;
}
