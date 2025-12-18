'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { syncInstagram, syncFacebook } from '@/lib/actions/sync';
import { disconnectAccount } from '@/lib/actions/accounts';

interface ConnectedAccount {
  id: string;
  platform: string;
  platformUsername: string | null;
  tokenExpiresAt: Date | null;
}

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: string;
  disabled?: boolean;
}

interface PlatformCardProps {
  platform: Platform;
  connectedAccounts: ConnectedAccount[];
}

export function PlatformCard({
  platform,
  connectedAccounts,
}: PlatformCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // For Meta platform, show both Instagram and Facebook accounts
  const connected =
    platform.id === 'meta'
      ? connectedAccounts.filter(
          (a) => a.platform === 'instagram' || a.platform === 'facebook'
        )
      : connectedAccounts.filter((a) => a.platform === platform.id);
  const isConnected = connected.length > 0;

  const handleConnect = () => {
    if (platform.id === 'meta') {
      // Meta OAuth handles both Instagram and Facebook
      window.location.href = '/api/oauth/meta';
    }
    // Add TikTok, YouTube later
  };

  const handleSync = async (platformId: string) => {
    setSyncing(true);
    try {
      if (platformId === 'meta') {
        // Sync both Instagram and Facebook
        const [igResult, fbResult] = await Promise.all([
          syncInstagram(),
          syncFacebook(),
        ]);

        const igSuccess = igResult?.success;
        const fbSuccess = fbResult?.success;

        if (igSuccess && fbSuccess) {
          const totalSynced = (igResult?.synced || 0) + (fbResult?.synced || 0);
          toast.success(`Synced ${totalSynced} items from Meta platforms`);
        } else if (igSuccess || fbSuccess) {
          const messages = [];
          if (igSuccess)
            messages.push(`Instagram: ${igResult?.message || 'Synced'}`);
          if (fbSuccess)
            messages.push(`Facebook: ${fbResult?.message || 'Synced'}`);
          if (!igSuccess)
            messages.push(`Instagram: ${igResult?.error || 'Failed'}`);
          if (!fbSuccess)
            messages.push(`Facebook: ${fbResult?.error || 'Failed'}`);
          toast.warning(messages.join(' | '));
        } else {
          toast.error('Sync failed for all platforms');
        }
      } else if (platformId === 'instagram') {
        const result = await syncInstagram();
        if (result?.success) {
          toast.success(result.message || 'Sync complete!');
        } else {
          toast.error(result?.error || 'Sync failed');
        }
      } else if (platformId === 'facebook') {
        const result = await syncFacebook();
        if (result?.success) {
          toast.success(result.message || 'Sync complete!');
        } else {
          toast.error(result?.error || 'Sync failed');
        }
      }
    } catch {
      toast.error('Sync failed');
    }
    setSyncing(false);
  };

  const handleDisconnect = async (accountId: string) => {
    if (
      !confirm(
        'Disconnect this account? This will also delete all synced videos.'
      )
    )
      return;

    startTransition(async () => {
      const result = await disconnectAccount(accountId);
      if (result.success) {
        toast.success(result.message || 'Account disconnected');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to disconnect account');
      }
    });
  };

  const isTokenExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return new Date(expiresAt) < sevenDaysFromNow;
  };

  return (
    <Card className='bg-zinc-900 border-zinc-800'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='flex items-center gap-3'>
          <div
            className='w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold'
            style={{
              backgroundColor: platform.color + '20',
              color: platform.color,
            }}
          >
            {platform.icon}
          </div>
          <div>
            <CardTitle className='text-white'>{platform.name}</CardTitle>
            <CardDescription>
              {isConnected
                ? `${connected.length} account${
                    connected.length > 1 ? 's' : ''
                  } connected`
                : 'Not connected'}
            </CardDescription>
          </div>
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-3'>
        {connected.map((account) => (
          <div
            key={account.id}
            className='flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg'
          >
            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <span className='text-zinc-300'>
                  @{account.platformUsername}
                </span>
                {platform.id === 'meta' && (
                  <Badge variant='outline' className='text-xs'>
                    {account.platform === 'instagram'
                      ? 'Instagram'
                      : 'Facebook'}
                  </Badge>
                )}
              </div>
              {isTokenExpiringSoon(account.tokenExpiresAt) && (
                <span className='text-xs text-orange-400 mt-1'>
                  Token expires soon
                </span>
              )}
            </div>
            <Button
              size='sm'
              variant='ghost'
              className='text-red-400 hover:text-red-300'
              onClick={() => handleDisconnect(account.id)}
              disabled={isPending}
            >
              Disconnect
            </Button>
          </div>
        ))}

        {isConnected && !platform.disabled && (
          <Button
            className='w-full'
            variant='outline'
            onClick={() => handleSync(platform.id)}
            disabled={syncing || isPending}
          >
            {syncing
              ? 'Syncing...'
              : platform.id === 'meta'
              ? 'Sync All Meta Accounts'
              : 'Sync'}
          </Button>
        )}

        {!platform.disabled && (
          <Button
            className='w-full'
            variant={isConnected ? 'outline' : 'default'}
            onClick={handleConnect}
            disabled={isPending}
          >
            {isConnected
              ? 'Add Another Account'
              : platform.id === 'meta'
              ? 'Connect Meta Account'
              : `Connect ${platform.name}`}
          </Button>
        )}

        {platform.disabled && (
          <Button className='w-full' variant='outline' disabled>
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
