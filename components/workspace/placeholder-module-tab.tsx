'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { disableModule } from '@/lib/actions/projects';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PlaceholderModuleTabProps {
  moduleType: 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets';
  moduleName: string;
  description: string;
  projectId: string;
}

export function PlaceholderModuleTab({
  moduleType,
  moduleName,
  description,
  projectId,
}: PlaceholderModuleTabProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const handleDisable = async () => {
    setIsPending(true);
    const result = await disableModule(projectId, moduleType);
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

