'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateClientModules } from '@/lib/actions/clients';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PlaceholderModuleTabProps {
  moduleType: 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets';
  moduleName: string;
  description: string;
  clientId: string;
  enabledModules: string[];
}

export function PlaceholderModuleTab({
  moduleType,
  moduleName,
  description,
  clientId,
  enabledModules,
}: PlaceholderModuleTabProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const handleDisable = async () => {
    setIsPending(true);
    const newModules = enabledModules.filter((m) => m !== moduleType);
    const result = await updateClientModules(clientId, newModules);
    if (result.success) {
      toast.success(`${moduleName} module disabled`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to disable module');
    }
    setIsPending(false);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{moduleName}</CardTitle>
          <CardDescription>Coming Soon</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>{description}</p>
          <div className='flex justify-end'>
            <Button variant='outline' onClick={handleDisable} disabled={isPending}>
              Disable Module
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

