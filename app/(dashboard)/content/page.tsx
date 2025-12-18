import { getContent } from '@/lib/data/data.content';
import { ContentTable } from '@/components/dashboard/content-table';

export default async function ContentPage() {
  const content = await getContent();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white'>Content</h1>
        <p className='text-zinc-400'>
          Manage and organize your social media content here.
        </p>
      </div>

      <ContentTable content={content} />
    </div>
  );
}
