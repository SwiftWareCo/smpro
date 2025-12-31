'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updateClientModules } from '@/lib/actions/clients';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ModuleEnablementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  enabledModules?: string[];
  children?: React.ReactNode;
}

const availableModules = [
  {
    type: 'social' as const,
    name: 'Social',
    description: 'Manage social media accounts and content',
  },
  {
    type: 'seo' as const,
    name: 'SEO',
    description: 'SEO settings and optimization',
  },
  {
    type: 'website_gmb' as const,
    name: 'Website/GMB',
    description: 'Website and Google My Business management',
  },
  {
    type: 'ai_receptionist' as const,
    name: 'AI Receptionist',
    description: 'AI-powered call handling and automation',
  },
  {
    type: 'automations' as const,
    name: 'Automations',
    description: 'Workflow automation and scheduling',
  },
  {
    type: 'assets' as const,
    name: 'Assets',
    description: 'Brand assets and media library',
  },
];

export function ModuleEnablementDialog({
  open,
  onOpenChange,
  clientId,
  enabledModules = [],
  children,
}: ModuleEnablementDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<Record<string, boolean>>({});

  // Build module states from enabledModules prop
  const getModuleState = (moduleType: string) => {
    return enabledModules.includes(moduleType);
  };

  const handleToggle = async (moduleType: string, currentState: boolean) => {
    setIsPending((prev) => ({ ...prev, [moduleType]: true }));

    // Toggle module in the array
    const newModules = currentState
      ? enabledModules.filter((m) => m !== moduleType)
      : [...enabledModules, moduleType];

    const result = await updateClientModules(clientId, newModules);

    if (result.success) {
      toast.success(`${availableModules.find((m) => m.type === moduleType)?.name} module ${currentState ? 'disabled' : 'enabled'}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update module');
    }

    setIsPending((prev) => ({ ...prev, [moduleType]: false }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Modules</DialogTitle>
          <DialogDescription>
            Enable or disable modules for this client
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {availableModules.map((module) => {
            const isEnabled = getModuleState(module.type);
            const pending = isPending[module.type] ?? false;

            return (
              <div key={module.type} className='flex items-center justify-between space-x-2'>
                <div className='flex-1 space-y-1'>
                  <Label htmlFor={module.type} className='text-sm font-medium'>
                    {module.name}
                  </Label>
                  <p className='text-xs text-muted-foreground'>{module.description}</p>
                </div>
                <Switch
                  id={module.type}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(module.type, !checked)}
                  disabled={pending}
                />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

