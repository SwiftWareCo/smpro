'use client';

import * as React from 'react';
import { Settings, Plus, ListTodo, Circle, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ModuleEnablementDialog } from './module-enablement-dialog';
import { ClientSettingsDialog } from './client-settings-dialog';
import { type Client } from '@/lib/db/schema/clients';
import { type SetupStatus } from '@/lib/utils/setup-checklist';

interface WorkspaceHeaderProps {
  client: Client;
  setupStatus: SetupStatus;
}

const statusColors: Record<string, string> = {
  lead: 'bg-blue-500/90 text-white border-transparent',
  onboarding: 'bg-yellow-500/90 text-white border-transparent',
  active: 'bg-green-500/90 text-white border-transparent',
  paused: 'bg-gray-500/90 text-white border-transparent',
  churned: 'bg-red-500/90 text-white border-transparent',
};

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  paused: 'Paused',
  churned: 'Churned',
};

export function WorkspaceHeader({
  client,
  setupStatus,
}: WorkspaceHeaderProps) {
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);

  // Get missing items from setup status
  const missingItems = setupStatus.items
    .filter((item) => !item.completed)
    .map((item) => item.label);

  const completionPercentage = setupStatus.percentage;

  return (
    <div className='border-b bg-background'>
      <div className='flex items-center justify-between p-4'>
        {/* Client info */}
        <div className='flex items-center gap-4'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src={client.avatarUrl || ''} alt={client.name} />
            <AvatarFallback>
              {client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex items-center gap-3'>
            <h1 className='text-xl font-semibold'>{client.name}</h1>
            <Badge
              variant='secondary'
              className={`text-xs capitalize ${
                statusColors[client.status] ||
                'bg-gray-500/90 text-white border-transparent'
              }`}
            >
              {statusLabels[client.status] || client.status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='relative'>
                <ListTodo className='h-4 w-4 mr-2' />
                Next Steps
                {missingItems.length > 0 && (
                  <Badge
                    variant='destructive'
                    className='ml-2 h-5 px-1.5 text-xs'
                  >
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
                    <span className='text-xs text-muted-foreground'>
                      {completionPercentage}%
                    </span>
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
                        <li
                          key={index}
                          className='flex items-start gap-2 text-sm'
                        >
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
          <Button
            variant='outline'
            size='sm'
            onClick={() => setModuleDialogOpen(true)}
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Module
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSettingsDialogOpen(true)}
          >
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Module Enablement Dialog */}
      <ModuleEnablementDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        clientId={client.id}
        enabledModules={client.enabledModules || []}
      />

      {/* Client Settings Dialog */}
      <ClientSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        client={client}
      />
    </div>
  );
}
