'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SeoTabProps {
  clientId: string;
}

export function SeoTab({ clientId }: SeoTabProps) {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>SEO Module</CardTitle>
          <CardDescription>SEO settings and optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            SEO module is enabled. SEO settings coming in Phase 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

