'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SocialTabProps {
  projectId: string;
}

export function SocialTab({ projectId }: SocialTabProps) {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Social Module</CardTitle>
          <CardDescription>Manage your social media accounts and content</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Social module is enabled. Enhanced features coming in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

