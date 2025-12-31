'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OverviewTab } from './overview-tab';
import { SocialTab } from './social-tab';
import { SeoTab } from './seo-tab';
import { PlaceholderModuleTab } from './placeholder-module-tab';

type Client = {
  id: string;
  name: string;
  enabledModules: string[] | null;
};

interface WorkspaceTabsProps {
  client: Client;
  accountsCount: number;
  seoConfigured?: boolean;
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

export function WorkspaceTabs({
  client,
  accountsCount,
  seoConfigured,
}: WorkspaceTabsProps) {
  const [activeTab, setActiveTab] = React.useState('overview');

  // Get enabled modules from client
  const enabledModules = client.enabledModules || [];

  // Build tabs list
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...enabledModules.map((moduleType) => ({
      id: moduleType,
      label: moduleDisplayNames[moduleType] || moduleType,
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
        <OverviewTab
          client={client}
          accountsCount={accountsCount}
          seoConfigured={seoConfigured}
        />
      </TabsContent>

      {enabledModules.map((moduleType) => {
        if (moduleType === 'social') {
          return (
            <TabsContent key={moduleType} value={moduleType} className='mt-4'>
              <SocialTab clientId={client.id} />
            </TabsContent>
          );
        }
        if (moduleType === 'seo') {
          return (
            <TabsContent key={moduleType} value={moduleType} className='mt-4'>
              <SeoTab clientId={client.id} />
            </TabsContent>
          );
        }
        // Other modules (website_gmb, ai_receptionist, automations, assets)
        const validPlaceholderTypes = ['website_gmb', 'ai_receptionist', 'automations', 'assets'] as const;
        if (validPlaceholderTypes.includes(moduleType as typeof validPlaceholderTypes[number])) {
          return (
            <TabsContent key={moduleType} value={moduleType} className='mt-4'>
              <PlaceholderModuleTab
                moduleType={moduleType as typeof validPlaceholderTypes[number]}
                moduleName={moduleDisplayNames[moduleType]}
                description={moduleDescriptions[moduleType]}
                clientId={client.id}
                enabledModules={enabledModules}
              />
            </TabsContent>
          );
        }
        return null;
      })}
    </Tabs>
  );
}

