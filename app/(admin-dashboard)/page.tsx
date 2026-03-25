import { AgencyUsageSummary } from "@/components/dashboard/agency-usage-summary";
import { ProviderLimitsCard } from "@/components/dashboard/provider-limits-card";

export default function DashboardPage() {
    return (
        <div className="space-y-4 p-3 sm:p-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Overview of your agency and client status
                </p>
            </div>

            <div className="grid gap-4">
                <AgencyUsageSummary />
                <ProviderLimitsCard />
            </div>
        </div>
    );
}
