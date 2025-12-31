'use client';

import * as React from 'react';
import { Settings, Plus, ListTodo, Circle, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ProjectDropdown } from './project-dropdown';
import { ModuleEnablementDialog } from './module-enablement-dialog';

type Client = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type ProjectModule = {
  id: string;
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets';
  isEnabled: boolean;
};

type Project = {
  id: string;
  name: string;
  status: string;
  isDefault: boolean;
  modules?: ProjectModule[];
};

interface WorkspaceHeaderProps {
  client: Client;
  projects: Project[];
  selectedProject: Project & { modules: ProjectModule[] };
}

export function WorkspaceHeader({ client, projects, selectedProject }: WorkspaceHeaderProps) {
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);

  // Check which modules are enabled
  const seoEnabled = selectedProject.modules.some((m) => m.moduleType === 'seo' && m.isEnabled);

  // Get next steps based on enabled modules
  const missingItems = [
    'Connect Instagram account',
    'Connect Facebook account',
    ...(seoEnabled ? ['Add website URL', 'Set target keywords'] : []),
  ];

  const completionPercentage = Math.round((0 / (missingItems.length || 1)) * 100);

  return (
    <div className='border-b bg-card px-4 py-3'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Avatar>
            <AvatarImage src={client.avatarUrl || undefined} alt={client.name} />
            <AvatarFallback>
              {client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex items-center gap-2'>
            <h1 className='text-xl font-semibold'>{client.name}</h1>
            <Badge variant='secondary'>Active</Badge>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <ProjectDropdown
            projects={projects}
            selectedProject={selectedProject}
            clientId={client.id}
          />

          <ModuleEnablementDialog
            open={moduleDialogOpen}
            onOpenChange={setModuleDialogOpen}
            projectId={selectedProject.id}
            enabledModules={selectedProject.modules}
          >
            <Button variant='outline' size='sm'>
              <Plus className='h-4 w-4 mr-2' />
              Add Module
            </Button>
          </ModuleEnablementDialog>

          {/* Next Steps Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='relative'>
                <ListTodo className='h-4 w-4 mr-2' />
                Next Steps
                {missingItems.length > 0 && (
                  <Badge variant='destructive' className='ml-2 h-5 px-1.5 text-xs'>
                    {missingItems.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80' align='end'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold text-sm'>Setup Progress</h4>
                    <span className='text-xs text-muted-foreground'>{completionPercentage}%</span>
                  </div>
                  <div className='h-2 bg-secondary rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-primary transition-all'
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <Separator />

                <div className='space-y-3'>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>
                    To Do ({missingItems.length})
                  </p>
                  {missingItems.length === 0 ? (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center'>
                      <CheckCircle2 className='h-4 w-4 text-green-500' />
                      All setup complete!
                    </div>
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
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant='ghost' size='sm'>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}

