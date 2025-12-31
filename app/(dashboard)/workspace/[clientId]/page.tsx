import { redirect } from 'next/navigation';
import { getClient } from '@/lib/data/data.clients';
import { getClientSetupStatus } from '@/lib/utils/setup-checklist';
import { getAccountsCount } from '@/lib/data/data.accounts';
import { getSeoSettings } from '@/lib/data/data.seo';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs';

interface WorkspacePageProps {
  params: Promise<{ clientId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { clientId } = await params;

  // Fetch client data, setup status, accounts count, and SEO settings in parallel
  const [client, setupStatus, accountsCount, seoSettings] = await Promise.all([
    getClient(clientId),
    getClientSetupStatus(clientId),
    getAccountsCount(clientId),
    getSeoSettings(clientId).catch(() => null),
  ]);

  const seoConfigured = Boolean(seoSettings?.websiteUrl);

  if (!client) {
    redirect('/');
  }

  return (
    <div className='flex flex-1 flex-col'>
      <WorkspaceHeader client={client} setupStatus={setupStatus} />
      <div className='flex flex-1 p-4'>
        <WorkspaceTabs
          client={client}
          accountsCount={accountsCount}
          seoConfigured={seoConfigured}
        />
      </div>
    </div>
  );
}
