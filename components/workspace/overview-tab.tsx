'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle } from 'lucide-react';

interface OverviewTabProps {
  clientId: string;
}

export function OverviewTab({ clientId }: OverviewTabProps) {
  const [notes, setNotes] = React.useState('');

  // TODO: Fetch client data and enabled modules
  // For now, placeholder with social enabled by default
  const socialEnabled = true;
  const seoEnabled = false;

  // Hardcoded checklist items (will be made dynamic later)
  const checklistItems = [
    { id: 'client-created', label: 'Client created', completed: true },
    { id: 'instagram-connected', label: 'Connect Instagram account', completed: false },
    { id: 'facebook-connected', label: 'Connect Facebook account', completed: false },
    ...(seoEnabled
      ? [
          { id: 'website-url', label: 'Add website URL (SEO)', completed: false },
          { id: 'target-keywords', label: 'Set target keywords (SEO)', completed: false },
        ]
      : []),
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const totalCount = checklistItems.length;

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
              <div className='text-2xl font-bold'>0</div>
              <p className='text-sm text-muted-foreground'>Connected accounts</p>
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
                <Circle className='h-5 w-5 text-muted-foreground' />
                <span className='text-sm'>Website URL missing</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TODO: Add other module tiles based on client.enabledModules */}
      </div>

      {/* Setup Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Client Setup Progress</CardTitle>
          <CardDescription>
            {completedCount} of {totalCount} complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {checklistItems.map((item) => (
              <div key={item.id} className='flex items-center gap-2'>
                {item.completed ? (
                  <CheckCircle2 className='h-5 w-5 text-green-500' />
                ) : (
                  <Circle className='h-5 w-5 text-muted-foreground' />
                )}
                <span className={item.completed ? 'text-muted-foreground line-through' : ''}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

