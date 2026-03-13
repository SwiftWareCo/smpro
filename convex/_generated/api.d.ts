/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_audit from "../_lib/audit.js";
import type * as _lib_auth from "../_lib/auth.js";
import type * as _lib_clerkAdmin from "../_lib/clerkAdmin.js";
import type * as accounts from "../accounts.js";
import type * as auditLogs from "../auditLogs.js";
import type * as autoblog from "../autoblog.js";
import type * as autoblogInternal from "../autoblogInternal.js";
import type * as autoblogPosts from "../autoblogPosts.js";
import type * as autoblogPublish from "../autoblogPublish.js";
import type * as autoblogScheduler from "../autoblogScheduler.js";
import type * as autoblogTopics from "../autoblogTopics.js";
import type * as clientProvisioning from "../clientProvisioning.js";
import type * as clients from "../clients.js";
import type * as content from "../content.js";
import type * as db_accounts_read from "../db/accounts/read.js";
import type * as db_accounts_write from "../db/accounts/write.js";
import type * as db_audit_read from "../db/audit/read.js";
import type * as db_audit_write from "../db/audit/write.js";
import type * as db_autoblog_read from "../db/autoblog/read.js";
import type * as db_autoblog_write from "../db/autoblog/write.js";
import type * as db_clients_read from "../db/clients/read.js";
import type * as db_clients_write from "../db/clients/write.js";
import type * as db_consents_write from "../db/consents/write.js";
import type * as db_content_read from "../db/content/read.js";
import type * as db_content_write from "../db/content/write.js";
import type * as db_dentalForms_read from "../db/dentalForms/read.js";
import type * as db_dentalForms_write from "../db/dentalForms/write.js";
import type * as db_embeddings_read from "../db/embeddings/read.js";
import type * as db_embeddings_write from "../db/embeddings/write.js";
import type * as db_ideas_write from "../db/ideas/write.js";
import type * as db_seo_read from "../db/seo/read.js";
import type * as db_seo_write from "../db/seo/write.js";
import type * as embeddings from "../embeddings.js";
import type * as formDeliveries from "../formDeliveries.js";
import type * as formDeliveriesActions from "../formDeliveriesActions.js";
import type * as formSubmissions from "../formSubmissions.js";
import type * as formSubmissionsActions from "../formSubmissionsActions.js";
import type * as formTemplates from "../formTemplates.js";
import type * as github from "../github.js";
import type * as ideas from "../ideas.js";
import type * as seo from "../seo.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/audit": typeof _lib_audit;
  "_lib/auth": typeof _lib_auth;
  "_lib/clerkAdmin": typeof _lib_clerkAdmin;
  accounts: typeof accounts;
  auditLogs: typeof auditLogs;
  autoblog: typeof autoblog;
  autoblogInternal: typeof autoblogInternal;
  autoblogPosts: typeof autoblogPosts;
  autoblogPublish: typeof autoblogPublish;
  autoblogScheduler: typeof autoblogScheduler;
  autoblogTopics: typeof autoblogTopics;
  clientProvisioning: typeof clientProvisioning;
  clients: typeof clients;
  content: typeof content;
  "db/accounts/read": typeof db_accounts_read;
  "db/accounts/write": typeof db_accounts_write;
  "db/audit/read": typeof db_audit_read;
  "db/audit/write": typeof db_audit_write;
  "db/autoblog/read": typeof db_autoblog_read;
  "db/autoblog/write": typeof db_autoblog_write;
  "db/clients/read": typeof db_clients_read;
  "db/clients/write": typeof db_clients_write;
  "db/consents/write": typeof db_consents_write;
  "db/content/read": typeof db_content_read;
  "db/content/write": typeof db_content_write;
  "db/dentalForms/read": typeof db_dentalForms_read;
  "db/dentalForms/write": typeof db_dentalForms_write;
  "db/embeddings/read": typeof db_embeddings_read;
  "db/embeddings/write": typeof db_embeddings_write;
  "db/ideas/write": typeof db_ideas_write;
  "db/seo/read": typeof db_seo_read;
  "db/seo/write": typeof db_seo_write;
  embeddings: typeof embeddings;
  formDeliveries: typeof formDeliveries;
  formDeliveriesActions: typeof formDeliveriesActions;
  formSubmissions: typeof formSubmissions;
  formSubmissionsActions: typeof formSubmissionsActions;
  formTemplates: typeof formTemplates;
  github: typeof github;
  ideas: typeof ideas;
  seo: typeof seo;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
