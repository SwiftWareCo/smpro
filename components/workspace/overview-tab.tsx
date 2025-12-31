'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle } from 'lucide-react';

type Client = {
  id: string;
  name: string;
  enabledModules: string[] | null;
};

interface OverviewTabProps {
  client: Client;
  accountsCount: number;
  seoConfigured?: boolean;
}

export function OverviewTab({
  client,
  accountsCount,
  seoConfigured,
}: OverviewTabProps) {
  const [notes, setNotes] = React.useState('');

  const enabledModules = client.enabledModules || [];
  const socialEnabled = enabledModules.includes('social');
  const seoEnabled = enabledModules.includes('seo');

  return (
    <div className='space-y-6'>
      {/* Health Tiles */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {socialEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Social</CardTitle>
              <CardDescription>Social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{accountsCount}</div>
              <p className='text-sm text-muted-foreground'>
                Connected account{accountsCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        )}

        {seoEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>SEO</CardTitle>
              <CardDescription>Website settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                {seoConfigured ? (
                  <>
                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                    <span className='text-sm'>Website configured</span>
                  </>
                ) : (
                  <>
                    <Circle className='h-5 w-5 text-muted-foreground' />
                    <span className='text-sm'>Website URL missing</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Client Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Client Notes</CardTitle>
          <CardDescription>Internal notes and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='Add notes about this client...'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

