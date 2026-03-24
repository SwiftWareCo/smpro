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
import type * as _lib_patientFormUrl from "../_lib/patientFormUrl.js";
import type * as _lib_rag from "../_lib/rag.js";
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
import type * as db_knowledgeBase_read from "../db/knowledgeBase/read.js";
import type * as db_knowledgeBase_write from "../db/knowledgeBase/write.js";
import type * as db_seo_read from "../db/seo/read.js";
import type * as db_seo_write from "../db/seo/write.js";
import type * as embeddings from "../embeddings.js";
import type * as formDeliveries from "../formDeliveries.js";
import type * as formDeliveriesActions from "../formDeliveriesActions.js";
import type * as formSubmissions from "../formSubmissions.js";
import type * as formSubmissionsActions from "../formSubmissionsActions.js";
import type * as formTemplateActions from "../formTemplateActions.js";
import type * as formTemplates from "../formTemplates.js";
import type * as github from "../github.js";
import type * as ideas from "../ideas.js";
import type * as kbAgent from "../kbAgent.js";
import type * as kbChat from "../kbChat.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as knowledgeBaseActions from "../knowledgeBaseActions.js";
import type * as migrations from "../migrations.js";
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
  "_lib/patientFormUrl": typeof _lib_patientFormUrl;
  "_lib/rag": typeof _lib_rag;
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
  "db/knowledgeBase/read": typeof db_knowledgeBase_read;
  "db/knowledgeBase/write": typeof db_knowledgeBase_write;
  "db/seo/read": typeof db_seo_read;
  "db/seo/write": typeof db_seo_write;
  embeddings: typeof embeddings;
  formDeliveries: typeof formDeliveries;
  formDeliveriesActions: typeof formDeliveriesActions;
  formSubmissions: typeof formSubmissions;
  formSubmissionsActions: typeof formSubmissionsActions;
  formTemplateActions: typeof formTemplateActions;
  formTemplates: typeof formTemplates;
  github: typeof github;
  ideas: typeof ideas;
  kbAgent: typeof kbAgent;
  kbChat: typeof kbChat;
  knowledgeBase: typeof knowledgeBase;
  knowledgeBaseActions: typeof knowledgeBaseActions;
  migrations: typeof migrations;
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

export declare const components: {
  agent: {
    apiKeys: {
      destroy: FunctionReference<
        "mutation",
        "internal",
        { apiKey?: string; name?: string },
        | "missing"
        | "deleted"
        | "name mismatch"
        | "must provide either apiKey or name"
      >;
      issue: FunctionReference<
        "mutation",
        "internal",
        { name?: string },
        string
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { apiKey: string },
        boolean
      >;
    };
    files: {
      addFile: FunctionReference<
        "mutation",
        "internal",
        {
          filename?: string;
          hash: string;
          mediaType?: string;
          mimeType?: string;
          storageId: string;
        },
        { fileId: string; storageId: string }
      >;
      copyFile: FunctionReference<
        "mutation",
        "internal",
        { fileId: string },
        null
      >;
      deleteFiles: FunctionReference<
        "mutation",
        "internal",
        { fileIds: Array<string>; force?: boolean },
        Array<string>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { fileId: string },
        null | {
          _creationTime: number;
          _id: string;
          filename?: string;
          hash: string;
          lastTouchedAt: number;
          mediaType?: string;
          mimeType?: string;
          refcount: number;
          storageId: string;
        }
      >;
      getFilesToDelete: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            filename?: string;
            hash: string;
            lastTouchedAt: number;
            mediaType?: string;
            mimeType?: string;
            refcount: number;
            storageId: string;
          }>;
        }
      >;
      useExistingFile: FunctionReference<
        "mutation",
        "internal",
        { filename?: string; hash: string },
        null | { fileId: string; storageId: string }
      >;
    };
    messages: {
      addMessages: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          embeddings?: {
            dimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            model: string;
            vectors: Array<Array<number> | null>;
          };
          failPendingSteps?: boolean;
          finishStreamId?: string;
          hideFromUserIdSearch?: boolean;
          messages: Array<{
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status?: "pending" | "success" | "failed";
            text?: string;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pendingMessageId?: string;
          promptMessageId?: string;
          threadId: string;
          userId?: string;
        },
        {
          messages: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
        }
      >;
      cloneThread: FunctionReference<
        "action",
        "internal",
        {
          batchSize?: number;
          copyUserIdForVectorSearch?: boolean;
          excludeToolMessages?: boolean;
          insertAtOrder?: number;
          limit?: number;
          sourceThreadId: string;
          statuses?: Array<"pending" | "success" | "failed">;
          targetThreadId: string;
          upToAndIncludingMessageId?: string;
        },
        number
      >;
      deleteByIds: FunctionReference<
        "mutation",
        "internal",
        { messageIds: Array<string> },
        Array<string>
      >;
      deleteByOrder: FunctionReference<
        "mutation",
        "internal",
        {
          endOrder: number;
          endStepOrder?: number;
          startOrder: number;
          startStepOrder?: number;
          threadId: string;
        },
        { isDone: boolean; lastOrder?: number; lastStepOrder?: number }
      >;
      finalizeMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          result: { status: "success" } | { error: string; status: "failed" };
        },
        null
      >;
      getMessagesByIds: FunctionReference<
        "query",
        "internal",
        { messageIds: Array<string> },
        Array<null | {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      getMessageSearchFields: FunctionReference<
        "query",
        "internal",
        { messageId: string },
        { embedding?: Array<number>; embeddingModel?: string; text?: string }
      >;
      listMessagesByThreadId: FunctionReference<
        "query",
        "internal",
        {
          excludeToolMessages?: boolean;
          order: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          statuses?: Array<"pending" | "success" | "failed">;
          threadId: string;
          upToAndIncludingMessageId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchMessages: FunctionReference<
        "action",
        "internal",
        {
          embedding?: Array<number>;
          embeddingModel?: string;
          limit: number;
          messageRange?: { after: number; before: number };
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          textSearch?: boolean;
          threadId?: string;
          vectorScoreThreshold?: number;
          vectorSearch?: boolean;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      textSearch: FunctionReference<
        "query",
        "internal",
        {
          limit: number;
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          threadId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      updateMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          patch: {
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mediaType?: string;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mediaType?: string;
                            mimeType?: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args?: any;
                            input: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args: any;
                            input?: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-text";
                                  value: string;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "error-json";
                                  value: any;
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  reason?: string;
                                  type: "execution-denied";
                                }
                              | {
                                  type: "content";
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        text: string;
                                        type: "text";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                    | {
                                        data: string;
                                        filename?: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "file-id";
                                      }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-data";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-url";
                                        url: string;
                                      }
                                    | {
                                        fileId: string | Record<string, string>;
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "image-file-id";
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >;
                                        type: "custom";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                        | {
                            approvalId: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            type: "tool-approval-request";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<
                    | {
                        args?: any;
                        experimental_content?: Array<
                          | { text: string; type: "text" }
                          | { data: string; mimeType?: string; type: "image" }
                        >;
                        isError?: boolean;
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-text";
                              value: string;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              type: "error-json";
                              value: any;
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >;
                              reason?: string;
                              type: "execution-denied";
                            }
                          | {
                              type: "content";
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    text: string;
                                    type: "text";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    type: "media";
                                  }
                                | {
                                    data: string;
                                    filename?: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "file-id";
                                  }
                                | {
                                    data: string;
                                    mediaType: string;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-data";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-url";
                                    url: string;
                                  }
                                | {
                                    fileId: string | Record<string, string>;
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "image-file-id";
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >;
                                    type: "custom";
                                  }
                              >;
                            };
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        result?: any;
                        toolCallId: string;
                        toolName: string;
                        type: "tool-result";
                      }
                    | {
                        approvalId: string;
                        approved: boolean;
                        providerExecuted?: boolean;
                        providerMetadata?: Record<string, Record<string, any>>;
                        providerOptions?: Record<string, Record<string, any>>;
                        reason?: string;
                        type: "tool-approval-response";
                      }
                  >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerOptions?: Record<string, Record<string, any>>;
            status?: "pending" | "success" | "failed";
          };
        },
        {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mediaType?: string;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mediaType?: string;
                          mimeType?: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args?: any;
                          input: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args: any;
                          input?: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-text";
                                value: string;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                type: "error-json";
                                value: any;
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >;
                                reason?: string;
                                type: "execution-denied";
                              }
                            | {
                                type: "content";
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      text: string;
                                      type: "text";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                  | {
                                      data: string;
                                      filename?: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "file-id";
                                    }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-data";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-url";
                                      url: string;
                                    }
                                  | {
                                      fileId: string | Record<string, string>;
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "image-file-id";
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >;
                                      type: "custom";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                      | {
                          approvalId: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          type: "tool-approval-request";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<
                  | {
                      args?: any;
                      experimental_content?: Array<
                        | { text: string; type: "text" }
                        | { data: string; mimeType?: string; type: "image" }
                      >;
                      isError?: boolean;
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-text";
                            value: string;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "error-json";
                            value: any;
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            reason?: string;
                            type: "execution-denied";
                          }
                        | {
                            type: "content";
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  text: string;
                                  type: "text";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  type: "media";
                                }
                              | {
                                  data: string;
                                  filename?: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "file-id";
                                }
                              | {
                                  data: string;
                                  mediaType: string;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-data";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-url";
                                  url: string;
                                }
                              | {
                                  fileId: string | Record<string, string>;
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "image-file-id";
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >;
                                  type: "custom";
                                }
                            >;
                          };
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      result?: any;
                      toolCallId: string;
                      toolName: string;
                      type: "tool-result";
                    }
                  | {
                      approvalId: string;
                      approved: boolean;
                      providerExecuted?: boolean;
                      providerMetadata?: Record<string, Record<string, any>>;
                      providerOptions?: Record<string, Record<string, any>>;
                      reason?: string;
                      type: "tool-approval-response";
                    }
                >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }
      >;
    };
    streams: {
      abort: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          reason: string;
          streamId: string;
        },
        boolean
      >;
      abortByOrder: FunctionReference<
        "mutation",
        "internal",
        { order: number; reason: string; threadId: string },
        boolean
      >;
      addDelta: FunctionReference<
        "mutation",
        "internal",
        { end: number; parts: Array<any>; start: number; streamId: string },
        boolean
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          stepOrder: number;
          threadId: string;
          userId?: string;
        },
        string
      >;
      deleteAllStreamsForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        { deltaCursor?: string; streamOrder?: number; threadId: string },
        { deltaCursor?: string; isDone: boolean; streamOrder?: number }
      >;
      deleteAllStreamsForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { threadId: string },
        null
      >;
      deleteStreamAsync: FunctionReference<
        "mutation",
        "internal",
        { cursor?: string; streamId: string },
        null
      >;
      deleteStreamSync: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      finish: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          streamId: string;
        },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          startOrder?: number;
          statuses?: Array<"streaming" | "finished" | "aborted">;
          threadId: string;
        },
        Array<{
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          status: "streaming" | "finished" | "aborted";
          stepOrder: number;
          streamId: string;
          userId?: string;
        }>
      >;
      listDeltas: FunctionReference<
        "query",
        "internal",
        {
          cursors: Array<{ cursor: number; streamId: string }>;
          threadId: string;
        },
        Array<{
          end: number;
          parts: Array<any>;
          start: number;
          streamId: string;
        }>
      >;
    };
    threads: {
      createThread: FunctionReference<
        "mutation",
        "internal",
        {
          defaultSystemPrompt?: string;
          parentThreadIds?: Array<string>;
          summary?: string;
          title?: string;
          userId?: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
      deleteAllForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        {
          cursor?: string;
          deltaCursor?: string;
          limit?: number;
          messagesDone?: boolean;
          streamOrder?: number;
          streamsDone?: boolean;
          threadId: string;
        },
        { isDone: boolean }
      >;
      deleteAllForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { limit?: number; threadId: string },
        null
      >;
      getThread: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        } | null
      >;
      listThreadsByUserId: FunctionReference<
        "query",
        "internal",
        {
          order?: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            status: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchThreadTitles: FunctionReference<
        "query",
        "internal",
        { limit: number; query: string; userId?: string | null },
        Array<{
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }>
      >;
      updateThread: FunctionReference<
        "mutation",
        "internal",
        {
          patch: {
            status?: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          };
          threadId: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
    };
    users: {
      deleteAllForUserId: FunctionReference<
        "action",
        "internal",
        { userId: string },
        null
      >;
      deleteAllForUserIdAsync: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        boolean
      >;
      listUsersWithThreads: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<string>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
    vector: {
      index: {
        deleteBatch: FunctionReference<
          "mutation",
          "internal",
          {
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
          },
          null
        >;
        deleteBatchForThread: FunctionReference<
          "mutation",
          "internal",
          {
            cursor?: string;
            limit: number;
            model: string;
            threadId: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          { continueCursor: string; isDone: boolean }
        >;
        insertBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            vectors: Array<{
              messageId?: string;
              model: string;
              table: string;
              threadId?: string;
              userId?: string;
              vector: Array<number>;
            }>;
          },
          Array<
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
          >
        >;
        paginate: FunctionReference<
          "query",
          "internal",
          {
            cursor?: string;
            limit: number;
            table?: string;
            targetModel: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          {
            continueCursor: string;
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
            isDone: boolean;
          }
        >;
        updateBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectors: Array<{
              id:
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string;
              model: string;
              vector: Array<number>;
            }>;
          },
          null
        >;
      };
    };
  };
  rag: {
    chunks: {
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          chunks: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entryId: string;
          startOrder: number;
        },
        { status: "pending" | "ready" | "replaced" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          entryId: string;
          order: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            metadata?: Record<string, any>;
            order: number;
            state: "pending" | "ready" | "replaced";
            text: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      replaceChunksPage: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        { nextStartOrder: number; status: "pending" | "ready" | "replaced" }
      >;
    };
    entries: {
      add: FunctionReference<
        "mutation",
        "internal",
        {
          allChunks?: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        {
          created: boolean;
          entryId: string;
          status: "pending" | "ready" | "replaced";
        }
      >;
      addAsync: FunctionReference<
        "mutation",
        "internal",
        {
          chunker: string;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        { created: boolean; entryId: string; status: "pending" | "ready" }
      >;
      deleteAsync: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        null
      >;
      deleteByKeyAsync: FunctionReference<
        "mutation",
        "internal",
        { beforeVersion?: number; key: string; namespaceId: string },
        null
      >;
      deleteByKeySync: FunctionReference<
        "action",
        "internal",
        { key: string; namespaceId: string },
        null
      >;
      deleteSync: FunctionReference<
        "action",
        "internal",
        { entryId: string },
        null
      >;
      findByContentHash: FunctionReference<
        "query",
        "internal",
        {
          contentHash: string;
          dimension: number;
          filterNames: Array<string>;
          key: string;
          modelId: string;
          namespace: string;
        },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { entryId: string },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          namespaceId?: string;
          order?: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { entryId: string },
        {
          replacedEntry: {
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          } | null;
        }
      >;
    };
    namespaces: {
      deleteNamespace: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          deletedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
      deleteNamespaceSync: FunctionReference<
        "action",
        "internal",
        { namespaceId: string },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | {
          createdAt: number;
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          namespaceId: string;
          status: "pending" | "ready" | "replaced";
          version: number;
        }
      >;
      getOrCreate: FunctionReference<
        "mutation",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          onComplete?: string;
          status: "pending" | "ready";
        },
        { namespaceId: string; status: "pending" | "ready" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listNamespaceVersions: FunctionReference<
        "query",
        "internal",
        {
          namespace: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      lookup: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | string
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          replacedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
    };
    search: {
      search: FunctionReference<
        "action",
        "internal",
        {
          chunkContext?: { after: number; before: number };
          dimension?: number;
          embedding?: Array<number>;
          filters: Array<{ name: string; value: any }>;
          limit: number;
          modelId: string;
          namespace: string;
          searchType?: "vector" | "text" | "hybrid";
          textQuery?: string;
          textWeight?: number;
          vectorScoreThreshold?: number;
          vectorWeight?: number;
        },
        {
          entries: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          results: Array<{
            content: Array<{ metadata?: Record<string, any>; text: string }>;
            entryId: string;
            order: number;
            score: number;
            startOrder: number;
          }>;
        }
      >;
    };
  };
};
