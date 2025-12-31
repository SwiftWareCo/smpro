'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Archive, Star } from 'lucide-react';
import { createProject, setDefaultProject, archiveProject } from '@/lib/actions/projects';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  status: string;
  isDefault: boolean;
};

interface ManageProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  projects: Project[];
}

interface CreateProjectFormData {
  name: string;
  description: string;
}

export function ManageProjectsDialog({
  open,
  onOpenChange,
  clientId,
  projects,
}: ManageProjectsDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<Record<string, boolean>>({});
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const form = useForm<CreateProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSetDefault = async (projectId: string) => {
    setIsPending((prev) => ({ ...prev, [projectId]: true }));
    const result = await setDefaultProject(projectId);
    if (result.success) {
      toast.success('Default project updated');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to set default project');
    }
    setIsPending((prev) => ({ ...prev, [projectId]: false }));
  };

  const handleArchive = async (projectId: string) => {
    setIsPending((prev) => ({ ...prev, [projectId]: true }));
    const result = await archiveProject(projectId);
    if (result.success) {
      toast.success('Project archived');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to archive project');
    }
    setIsPending((prev) => ({ ...prev, [projectId]: false }));
  };

  const handleCreateProject = async (data: CreateProjectFormData) => {
    setIsPending((prev) => ({ ...prev, create: true }));
    const result = await createProject({
      clientId,
      name: data.name,
      description: data.description || undefined,
    });
    if (result.success) {
      toast.success(`Project "${data.name}" created`);
      form.reset();
      setCreateDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create project');
    }
    setIsPending((prev) => ({ ...prev, create: false }));
  };

  // Sort projects: default first, then by name
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
          <DialogDescription>
            Create, edit, and manage projects for this client
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex justify-end'>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Create New Project
            </Button>
          </div>

          <div className='space-y-2'>
            {sortedProjects.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No projects yet. Create your first project to get started.
              </p>
            ) : (
              sortedProjects.map((project) => (
                <div
                  key={project.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{project.name}</span>
                        {project.isDefault && (
                          <Badge variant='secondary' className='text-xs'>
                            <Star className='h-3 w-3 mr-1' />
                            Default
                          </Badge>
                        )}
                        <Badge variant='outline' className='text-xs'>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {!project.isDefault && (
                      <>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleSetDefault(project.id)}
                          disabled={isPending[project.id]}
                        >
                          {isPending[project.id] ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <>
                              <Star className='h-4 w-4 mr-1' />
                              Set Default
                            </>
                          )}
                        </Button>
                        {project.status !== 'archived' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleArchive(project.id)}
                            disabled={isPending[project.id]}
                          >
                            {isPending[project.id] ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <>
                                <Archive className='h-4 w-4 mr-1' />
                                Archive
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Project Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project for this client
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreateProject)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='name'
                  rules={{ required: 'Project name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Social Growth Q1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='Brief description...' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isPending.create}>
                    {isPending.create ? (
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    ) : (
                      <Plus className='h-4 w-4 mr-2' />
                    )}
                    Create
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

