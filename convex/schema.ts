import { defineSchema } from "convex/server";

import { auditLogs } from "./schema/audit-log.schema";
import {
    autoblogIdeas,
    autoblogPosts,
    autoblogPublishLogs,
    autoblogSettings,
} from "./schema/autoblog.schema";
import { clientSeoSettings } from "./schema/client-seo-settings.schema";
import { clients } from "./schema/clients.schema";
import { connectedAccounts } from "./schema/connected-accounts.schema";
import { consentRecords } from "./schema/consents.schema";
import { content } from "./schema/content.schema";
import {
    formDeliveries,
    formSubmissions,
    formTemplates,
} from "./schema/dental-forms.schema";
import { embeddings } from "./schema/embeddings.schema";
import { savedIdeas } from "./schema/ideas.schema";
import { kbDocuments, kbFolders, kbThreads } from "./schema/knowledge-base.schema";
import { resources } from "./schema/resources.schema";

export default defineSchema({
    auditLogs,
    autoblogSettings,
    autoblogIdeas,
    autoblogPosts,
    autoblogPublishLogs,
    clients,
    connectedAccounts,
    consentRecords,
    content,
    clientSeoSettings,
    formDeliveries,
    formSubmissions,
    formTemplates,
    kbDocuments,
    kbFolders,
    kbThreads,
    savedIdeas,
    resources,
    embeddings,
});
