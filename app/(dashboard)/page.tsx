import { getClients } from '@/lib/data/data.clients';
import { getClientsSetupStatus } from '@/lib/utils/setup-checklist';
import { AtRiskClients } from '@/components/dashboard/at-risk-clients';

export default async function DashboardPage() {
  const clients = await getClients();

  // Get setup status for all clients
  const clientIds = clients.map((c) => c.id);
  const setupStatuses = await getClientsSetupStatus(clientIds);

  // Convert Map to plain object for serialization
  const setupStatusesObj: Record<
    string,
    { percentage: number; missingItems: string[] }
  > = {};
  setupStatuses.forEach((status, clientId) => {
    setupStatusesObj[clientId] = {
      percentage: status.percentage,
      missingItems: status.items
        .filter((item) => !item.completed)
        .slice(0, 2)
        .map((item) => item.label),
    };
  });


  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Overview of your agency and client status
        </p>
      </div>

      <div className='grid gap-6'>
        <AtRiskClients clients={clients} setupStatuses={setupStatusesObj} />
      </div>
    </div>
  );
}
