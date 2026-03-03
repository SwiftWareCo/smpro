import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { AtRiskClients } from "@/components/dashboard/at-risk-clients";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { SetupStatus } from "@/components/workspace/setup-types";

export default async function DashboardPage() {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    const clients: Doc<"clients">[] = await fetchQuery(
        api.clients.list,
        {},
        {
            token: token ?? undefined,
        },
    );

    // Get setup status for all clients
    const clientIds = clients.map((c) => c._id);
    const setupStatuses: Array<{ clientId: string; status: SetupStatus }> =
        await fetchQuery(
            api.clients.getSetupStatuses,
            { clientIds },
            { token: token ?? undefined },
        );

    // Convert results to plain object for serialization
    const setupStatusesObj: Record<
        string,
        { percentage: number; missingItems: string[] }
    > = {};
    setupStatuses.forEach(({ clientId, status }) => {
        setupStatusesObj[clientId] = {
            percentage: status.percentage,
            missingItems: status.items
                .filter((item) => !item.completed)
                .slice(0, 2)
                .map((item) => item.label),
        };
    });

    return (
        <div className="space-y-6 p-4">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your agency and client status
                </p>
            </div>

            <div className="grid gap-6">
                <AtRiskClients
                    clients={clients}
                    setupStatuses={setupStatusesObj}
                />
            </div>
        </div>
    );
}
