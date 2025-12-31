'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, ArrowLeft, Loader2 } from 'lucide-react';
import { createProject } from '@/lib/actions/projects';
import { toast } from 'sonner';

interface EmptyProjectStateProps {
  client: {
    id: string;
    name: string;
  };
  clientId: string;
}

export function EmptyProjectState({ client, clientId }: EmptyProjectStateProps) {
  const router = useRouter();
  const [projectName, setProjectName] = React.useState('General');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const result = await createProject({
        clientId,
        name: projectName.trim() || 'General',
        description: 'Default project',
      });

      if (result.success) {
        toast.success('Project created successfully!');
        router.refresh(); // Refresh to load the new project
      } else {
        toast.error(result.error || 'Failed to create project');
        setIsCreating(false);
      }
    } catch (error) {
      toast.error('An error occurred');
      setIsCreating(false);
    }
  };

  return (
    <div className='flex flex-1 items-center justify-center p-8'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
            <Folder className='h-8 w-8 text-muted-foreground' />
          </div>
          <CardTitle>No Projects Yet</CardTitle>
          <CardDescription>
            <strong>{client.name}</strong> doesn&apos;t have any projects. Create one to get started
            with modules and content.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form onSubmit={handleCreateProject} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='projectName'>Project Name</Label>
              <Input
                id='projectName'
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder='General'
                disabled={isCreating}
              />
            </div>
            <Button type='submit' className='w-full' disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Your First Project'
              )}
            </Button>
          </form>

          <Button
            variant='outline'
            className='w-full'
            onClick={() => router.push('/')}
            disabled={isCreating}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
