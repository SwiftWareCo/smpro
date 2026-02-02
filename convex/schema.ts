import { defineSchema } from 'convex/server';

import { clientSeoSettings } from './schema/client-seo-settings.schema';
import { clients } from './schema/clients.schema';
import { connectedAccounts } from './schema/connected-accounts.schema';
import { content } from './schema/content.schema';
import { embeddings } from './schema/embeddings.schema';
import { savedIdeas } from './schema/ideas.schema';
import { resources } from './schema/resources.schema';

export default defineSchema({
  clients,
  connectedAccounts,
  content,
  clientSeoSettings,
  savedIdeas,
  resources,
  embeddings,
});
