'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ManageProjectsDialog } from './manage-projects-dialog';

type Project = {
  id: string;
  name: string;
  status: string;
  isDefault: boolean;
};

interface ProjectDropdownProps {
  projects: Project[];
  selectedProject: Project;
  clientId: string;
}

export function ProjectDropdown({
  projects,
  selectedProject,
  clientId,
}: ProjectDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'manage') {
      setManageDialogOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('project', projectId);
    router.push(`/workspace/${clientId}?${params.toString()}`);
  };

  // Sort projects: default first
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  return (
    <>
      <Select value={selectedProject.id} onValueChange={handleProjectChange}>
        <SelectTrigger className='w-[180px]'>
          <SelectValue className='cursor-pointer'>
            <span className='flex items-center gap-2'>
              <span>Project: {selectedProject.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='z-50' position='popper'>
          {sortedProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
              {project.isDefault && (
                <span className='ml-2 text-xs text-muted-foreground'>
                  (Default)
                </span>
              )}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value='manage'>
            <div className='flex items-center gap-2'>
              <Settings className='h-4 w-4' />
              Manage Projects
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <ManageProjectsDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        clientId={clientId}
        projects={projects}
      />
    </>
  );
}
