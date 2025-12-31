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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { enableModule, disableModule } from '@/lib/actions/projects';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type ProjectModule = {
  id: string;
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets';
  isEnabled: boolean;
};

interface ModuleEnablementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  enabledModules?: ProjectModule[];
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
  projectId,
  enabledModules = [],
  children,
}: ModuleEnablementDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<Record<string, boolean>>({});

  // Build module states from enabledModules prop
  const getModuleState = (moduleType: string) => {
    return enabledModules.some((m) => m.moduleType === moduleType && m.isEnabled);
  };

  const handleToggle = async (moduleType: string, currentState: boolean) => {
    setIsPending((prev) => ({ ...prev, [moduleType]: true }));
    
    const result = currentState
      ? await disableModule(projectId, moduleType as any)
      : await enableModule(projectId, moduleType as any);

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
            Enable or disable modules for this project
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

