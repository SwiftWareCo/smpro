'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OverviewTab } from './overview-tab';
import { SocialTab } from './social-tab';
import { SeoTab } from './seo-tab';
import { PlaceholderModuleTab } from './placeholder-module-tab';

type ProjectModule = {
  id: string;
  projectId: string;
  moduleType: 'social' | 'seo' | 'website_gmb' | 'ai_receptionist' | 'automations' | 'assets';
  isEnabled: boolean;
};

type Project = {
  id: string;
  name: string;
  modules: ProjectModule[];
};

interface WorkspaceTabsProps {
  project: Project;
}

const moduleDisplayNames: Record<string, string> = {
  social: 'Social',
  seo: 'SEO',
  website_gmb: 'Website/GMB',
  ai_receptionist: 'AI Receptionist',
  automations: 'Automations',
  assets: 'Assets',
};

const moduleDescriptions: Record<string, string> = {
  social: 'Manage social media accounts and content',
  seo: 'SEO settings and optimization',
  website_gmb: 'Website and Google My Business management',
  ai_receptionist: 'AI-powered call handling and automation',
  automations: 'Workflow automation and scheduling',
  assets: 'Brand assets and media library',
};

export function WorkspaceTabs({ project }: WorkspaceTabsProps) {
  const [activeTab, setActiveTab] = React.useState('overview');

  // Get enabled modules
  const enabledModules = project.modules.filter((m) => m.isEnabled);

  // Build tabs list
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...enabledModules.map((module) => ({
      id: module.moduleType,
      label: moduleDisplayNames[module.moduleType] || module.moduleType,
    })),
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value='overview' className='mt-4'>
        <OverviewTab project={project} />
      </TabsContent>

      {enabledModules.map((module) => {
        if (module.moduleType === 'social') {
          return (
            <TabsContent key={module.id} value={module.moduleType} className='mt-4'>
              <SocialTab projectId={project.id} />
            </TabsContent>
          );
        }
        if (module.moduleType === 'seo') {
          return (
            <TabsContent key={module.id} value={module.moduleType} className='mt-4'>
              <SeoTab projectId={project.id} />
            </TabsContent>
          );
        }
        return (
          <TabsContent key={module.id} value={module.moduleType} className='mt-4'>
            <PlaceholderModuleTab
              moduleType={module.moduleType}
              moduleName={moduleDisplayNames[module.moduleType]}
              description={moduleDescriptions[module.moduleType]}
              projectId={project.id}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

