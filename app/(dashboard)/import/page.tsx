import { getClients } from '@/lib/data/data.clients';
import { ImportPageClient } from '@/components/dashboard/import-page-client';

export default async function ImportPage() {
  const clients = await getClients();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white'>Import Data</h1>
        <p className='text-zinc-400'>
          Create clients and import content from your social media platforms.
        </p>
      </div>

      <ImportPageClient initialClients={clients} />
    </div>
  );
}
