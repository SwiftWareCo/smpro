import { getContent } from '@/lib/data/data.content';
import { getClient } from '@/lib/data/data.clients';
import { ContentTable } from '@/components/dashboard/content-table';

interface ContentPageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const { client: clientId } = await searchParams;

  const [contentData, client] = await Promise.all([
    getContent({ clientId }),
    clientId ? getClient(clientId) : null,
  ]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white'>
          {client ? client.name : 'All Content'}
        </h1>
        <p className='text-zinc-400'>
          {client
            ? `Viewing content for ${client.name}`
            : 'Manage and organize your social media content here.'}
        </p>
      </div>

      <ContentTable content={contentData} />
    </div>
  );
}
