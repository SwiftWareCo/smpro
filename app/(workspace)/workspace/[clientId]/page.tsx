import { redirect } from 'next/navigation';
import { getClient } from '@/lib/data/data.clients';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs';

interface WorkspacePageProps {
  params: Promise<{ clientId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { clientId } = await params;

  // Fetch client data
  const client = await getClient(clientId);

  if (!client) {
    redirect('/');
  }

  return (
    <div className='flex flex-1 flex-col'>
      <WorkspaceHeader client={client} />
      <div className='flex flex-1 p-4'>
        <WorkspaceTabs client={client} />
      </div>
    </div>
  );
}
