import { defineTable } from "convex/server";
import { v } from "convex/values";

export const kbDocuments = defineTable({
    clientId: v.id("clients"),
    folderId: v.optional(v.id("kbFolders")),
    title: v.string(),
    description: v.optional(v.string()),
    sourceType: v.union(v.literal("upload"), v.literal("manual")),
    fileType: v.optional(
        v.union(
            v.literal("pdf"),
            v.literal("markdown"),
            v.literal("csv"),
            v.literal("txt"),
        ),
    ),
    storageId: v.optional(v.id("_storage")),
    rawText: v.optional(v.string()),
    charCount: v.optional(v.number()),
    processingStatus: v.union(
        v.literal("pending"),
        v.literal("extracting"),
        v.literal("embedding"),
        v.literal("ready"),
        v.literal("failed"),
    ),
    chunkCount: v.optional(v.number()),
    processingError: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client_id", ["clientId"])
    .index("by_client_folder", ["clientId", "folderId"])
    .index("by_client_status", ["clientId", "processingStatus"]);

export const kbFolders = defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("kbFolders")),
    sortOrder: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
})
    .index("by_client_id", ["clientId"])
    .index("by_client_parent", ["clientId", "parentId"]);

export const kbThreads = defineTable({
    clientId: v.id("clients"),
    agentThreadId: v.string(),
    title: v.optional(v.string()),
    userId: v.string(),
    lastMessageAt: v.number(),
})
    .index("by_client_user", ["clientId", "userId"])
    .index("by_agent_thread", ["agentThreadId"]);
