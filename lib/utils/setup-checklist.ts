import 'server-only';

import { db } from '@/lib/db';
import { clients, connectedAccounts, clientSeoSettings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Types
export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  module: 'base' | 'social' | 'seo' | 'assets';
}

export interface SetupStatus {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

// Checklist rule definitions
const CHECKLIST_RULES = {
  base: [
    { id: 'client-avatar', label: 'Add client avatar', module: 'base' as const },
    {
      id: 'client-description',
      label: 'Add client description',
      module: 'base' as const,
    },
  ],
  social: [
    {
      id: 'instagram-connected',
      label: 'Connect Instagram account',
      module: 'social' as const,
    },
    {
      id: 'facebook-connected',
      label: 'Connect Facebook account',
      module: 'social' as const,
    },
  ],
  seo: [
    {
      id: 'website-url',
      label: 'Add website URL',
      module: 'seo' as const,
    },
    {
      id: 'target-keywords',
      label: 'Set target keywords',
      module: 'seo' as const,
    },
    {
      id: 'target-locations',
      label: 'Set target locations',
      module: 'seo' as const,
    },
  ],
  assets: [
    { id: 'logo-uploaded', label: 'Upload logo', module: 'assets' as const },
    {
      id: 'brand-colors',
      label: 'Set brand colors',
      module: 'assets' as const,
    },
  ],
};

interface ClientData {
  id: string;
  avatarUrl: string | null;
  description: string | null;
  enabledModules: string[] | null;
}

interface SeoData {
  websiteUrl: string | null;
  targetKeywords: string[] | null;
  targetLocations: string[] | null;
}

interface AccountCounts {
  instagram: number;
  facebook: number;
}

async function getClientData(clientId: string): Promise<ClientData | null> {
  const result = await db
    .select({
      id: clients.id,
      avatarUrl: clients.avatarUrl,
      description: clients.description,
      enabledModules: clients.enabledModules,
    })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  return result[0] || null;
}

async function getSeoData(clientId: string): Promise<SeoData | null> {
  const result = await db
    .select({
      websiteUrl: clientSeoSettings.websiteUrl,
      targetKeywords: clientSeoSettings.targetKeywords,
      targetLocations: clientSeoSettings.targetLocations,
    })
    .from(clientSeoSettings)
    .where(eq(clientSeoSettings.clientId, clientId))
    .limit(1);

  return result[0] || null;
}

async function getAccountCounts(clientId: string): Promise<AccountCounts> {
  const result = await db
    .select({
      platform: connectedAccounts.platform,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(connectedAccounts)
    .where(eq(connectedAccounts.clientId, clientId))
    .groupBy(connectedAccounts.platform);

  const counts: AccountCounts = { instagram: 0, facebook: 0 };
  for (const row of result) {
    if (row.platform === 'instagram') counts.instagram = Number(row.count);
    if (row.platform === 'facebook') counts.facebook = Number(row.count);
  }

  return counts;
}

function evaluateChecklist(
  clientData: ClientData,
  seoData: SeoData | null,
  accountCounts: AccountCounts
): ChecklistItem[] {
  const enabledModules = clientData.enabledModules || ['social'];
  const items: ChecklistItem[] = [];

  // Base items (always included)
  items.push({
    ...CHECKLIST_RULES.base[0],
    completed: !!clientData.avatarUrl,
  });
  items.push({
    ...CHECKLIST_RULES.base[1],
    completed: !!clientData.description,
  });

  // Social module items
  if (enabledModules.includes('social')) {
    items.push({
      ...CHECKLIST_RULES.social[0],
      completed: accountCounts.instagram > 0,
    });
    items.push({
      ...CHECKLIST_RULES.social[1],
      completed: accountCounts.facebook > 0,
    });
  }

  // SEO module items
  if (enabledModules.includes('seo')) {
    items.push({
      ...CHECKLIST_RULES.seo[0],
      completed: !!seoData?.websiteUrl,
    });
    items.push({
      ...CHECKLIST_RULES.seo[1],
      completed: (seoData?.targetKeywords?.length ?? 0) > 0,
    });
    items.push({
      ...CHECKLIST_RULES.seo[2],
      completed: (seoData?.targetLocations?.length ?? 0) > 0,
    });
  }

  // Assets module items (placeholder - not yet implemented)
  if (enabledModules.includes('assets')) {
    items.push({
      ...CHECKLIST_RULES.assets[0],
      completed: false, // TODO: Check when assets module is implemented
    });
    items.push({
      ...CHECKLIST_RULES.assets[1],
      completed: false, // TODO: Check when assets module is implemented
    });
  }

  return items;
}

export async function getClientSetupStatus(
  clientId: string
): Promise<SetupStatus> {
  const [clientData, seoData, accountCounts] = await Promise.all([
    getClientData(clientId),
    getSeoData(clientId),
    getAccountCounts(clientId),
  ]);

  if (!clientData) {
    return {
      items: [],
      completedCount: 0,
      totalCount: 0,
      percentage: 0,
    };
  }

  const items = evaluateChecklist(clientData, seoData, accountCounts);
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  return {
    items,
    completedCount,
    totalCount,
    percentage,
  };
}


// Batch version for clients cards (more efficient)
export async function getClientsSetupStatus(
  clientIds: string[]
): Promise<Map<string, SetupStatus>> {
  const results = new Map<string, SetupStatus>();

  // TODO: Optimize with batch queries if needed for performance
  await Promise.all(
    clientIds.map(async (clientId) => {
      const status = await getClientSetupStatus(clientId);
      results.set(clientId, status);
    })
  );

  return results;
}
