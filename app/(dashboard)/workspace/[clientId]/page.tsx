import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface WorkspacePageProps {
    params: Promise<{ clientId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
    const { clientId: clientIdParam } = await params;
    const clientId = clientIdParam as Id<"clients">;
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    const convexOptions = { token: token ?? undefined };

    const client = await fetchQuery(
        api.clients.get,
        { clientId },
        convexOptions,
    ).catch(() => null);

    if (!client) {
        redirect("/");
    }

    // Fetch setup status, accounts, and SEO settings in parallel
    const [setupStatus, accounts, seoSettings] = await Promise.all([
        fetchQuery(api.clients.getSetupStatus, { clientId }, convexOptions),
        fetchQuery(api.accounts.listByClient, { clientId }, convexOptions),
        fetchQuery(api.seo.getByClient, { clientId }, convexOptions),
    ]);

    const seoConfigured = Boolean(seoSettings?.websiteUrl);

    return (
        <div className="flex flex-1 flex-col">
            <WorkspaceHeader client={client} setupStatus={setupStatus} />
            <div className="flex flex-1 p-4">
                <WorkspaceTabs
                    client={client}
                    accounts={accounts}
                    seoConfigured={seoConfigured}
                />
            </div>
        </div>
    );
}
