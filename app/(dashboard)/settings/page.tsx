import { Suspense } from 'react';
import { getConnectedAccounts } from '@/lib/data/data.accounts';
import { PlatformCard } from '@/components/settings/platform-card';
import { SettingsToast } from '@/components/settings/settings-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const platforms = [
  {
    id: 'meta',
    name: 'Meta (Instagram & Facebook)',
    color: '#1877F2',
    icon: '📘',
  },
  { id: 'tiktok', name: 'TikTok', color: '#00f2ea', icon: '♪', disabled: true },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    icon: '▶',
    disabled: true,
  },
];

export default async function SettingsPage() {
  const accounts = await getConnectedAccounts();

  return (
    <div className='space-y-6 p-4'>
      <Suspense fallback={null}>
        <SettingsToast />
      </Suspense>
      <div>
        <h2 className='text-2xl font-bold text-foreground'>
          Connected Accounts
        </h2>
        <p className='text-muted-foreground'>
          Connect your social media accounts to sync content
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            connectedAccounts={accounts}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className='text-muted-foreground space-y-2'>
          <p>
            • Instagram requires a Business or Creator account connected to a
            Facebook Page
          </p>
          <p>• Meta tokens never expire (Business Integration)</p>
          <p>
            • All Instagram content is synced (videos, reels, photos, and
            carousels)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
