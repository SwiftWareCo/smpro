'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ProjectModule = {
  id: string;
  moduleType: string;
  isEnabled: boolean;
};

type Project = {
  id: string;
  name: string;
  modules: ProjectModule[];
};

interface OverviewTabProps {
  project: Project;
}

export function OverviewTab({ project }: OverviewTabProps) {
  const [notes, setNotes] = React.useState('');

  // Check which modules are enabled
  const socialEnabled = project.modules.some((m) => m.moduleType === 'social' && m.isEnabled);
  const seoEnabled = project.modules.some((m) => m.moduleType === 'seo' && m.isEnabled);

  // Hardcoded checklist items (Phase 3 will make this dynamic)
  const checklistItems = [
    { id: 'client-created', label: 'Client created', completed: true },
    { id: 'project-created', label: 'Project created', completed: true },
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

        {project.modules
          .filter((m) => m.isEnabled && m.moduleType !== 'social' && m.moduleType !== 'seo')
          .map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className='text-base capitalize'>{module.moduleType.replace('_', ' ')}</CardTitle>
                <CardDescription>Module status</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant='secondary'>Coming Soon</Badge>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Setup Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Project Setup Progress</CardTitle>
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

      {/* Project Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Project Notes</CardTitle>
          <CardDescription>Internal notes and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='Add notes about this project...'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

