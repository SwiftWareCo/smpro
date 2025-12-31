'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface NextStepsPanelProps {
  project: Project;
}

export function NextStepsPanel({ project }: NextStepsPanelProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  // Check which modules are enabled
  const seoEnabled = project.modules.some((m) => m.moduleType === 'seo' && m.isEnabled);

  // Hardcoded missing items (Phase 3 will make this dynamic)
  const missingItems = [
    'Connect Instagram account',
    'Connect Facebook account',
    ...(seoEnabled ? ['Add website URL', 'Set target keywords'] : []),
  ];

  return (
    <div className='w-80 shrink-0'>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className='cursor-pointer hover:bg-accent/50 transition-colors'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>Next Steps</CardTitle>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
              <CardDescription>Missing items to complete setup</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {missingItems.length === 0 ? (
                <p className='text-sm text-muted-foreground'>All setup complete!</p>
              ) : (
                <ul className='space-y-2'>
                  {missingItems.map((item, index) => (
                    <li key={index} className='flex items-start gap-2 text-sm'>
                      <Circle className='h-4 w-4 mt-0.5 text-muted-foreground shrink-0' />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

