import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireClientAccess } from "./_lib/auth";
import * as KBRead from "./db/knowledgeBase/read";
import * as KBWrite from "./db/knowledgeBase/write";

// --- Document Queries ---

export const listDocuments = query({
    args: {
        clientId: v.id("clients"),
        folderId: v.optional(v.id("kbFolders")),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        if (args.folderId !== undefined) {
            return KBRead.listDocumentsByFolder(
                ctx,
                args.clientId,
                args.folderId,
            );
        }
        return KBRead.listDocumentsByClient(ctx, args.clientId);
    },
});

export const getDocument = query({
    args: { documentId: v.id("kbDocuments") },
    handler: async (ctx, args) => {
        const doc = await KBRead.getDocumentById(ctx, args.documentId);
        if (!doc) return null;
        await requireClientAccess(ctx, doc.clientId);
        return doc;
    },
});

// --- Document Mutations ---

export const generateUploadUrl = mutation({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return ctx.storage.generateUploadUrl();
    },
});

export const uploadDocument = mutation({
    args: {
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        folderId: v.optional(v.id("kbFolders")),
        storageId: v.id("_storage"),
        fileType: v.union(
            v.literal("pdf"),
            v.literal("markdown"),
            v.literal("csv"),
            v.literal("txt"),
        ),
    },
    handler: async (ctx, args) => {
        const client = await requireClientAccess(ctx, args.clientId);

        const documentId = await KBWrite.createDocument(ctx, {
            clientId: args.clientId,
            folderId: args.folderId,
            title: args.title,
            description: args.description,
            sourceType: "upload",
            fileType: args.fileType,
            storageId: args.storageId,
            processingStatus: "pending",
            createdBy: client.userId,
        });

        await ctx.scheduler.runAfter(
            0,
            internal.knowledgeBaseActions.processDocument,
            { documentId },
        );

        return documentId;
    },
});

export const createManualDocument = mutation({
    args: {
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        folderId: v.optional(v.id("kbFolders")),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const client = await requireClientAccess(ctx, args.clientId);

        const documentId = await KBWrite.createDocument(ctx, {
            clientId: args.clientId,
            folderId: args.folderId,
            title: args.title,
            description: args.description,
            sourceType: "manual",
            rawText: args.content,
            charCount: args.content.length,
            processingStatus: "pending",
            createdBy: client.userId,
        });

        await ctx.scheduler.runAfter(
            0,
            internal.knowledgeBaseActions.processDocument,
            { documentId },
        );

        return documentId;
    },
});

export const removeDocument = mutation({
    args: { documentId: v.id("kbDocuments") },
    handler: async (ctx, args) => {
        const doc = await KBRead.getDocumentById(ctx, args.documentId);
        if (!doc) throw new Error("Document not found");

        await requireClientAccess(ctx, doc.clientId);

        // Delete storage file if it exists
        if (doc.storageId) {
            await ctx.storage.delete(doc.storageId);
        }

        await KBWrite.deleteDocument(ctx, args.documentId);

        // Schedule RAG entry cleanup (runs in action context)
        await ctx.scheduler.runAfter(
            0,
            internal.knowledgeBaseActions.deleteRagEntry,
            {
                documentId: args.documentId,
                clientId: doc.clientId,
            },
        );

        return { success: true };
    },
});

// --- Folder Queries ---

export const listFolders = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return KBRead.listFoldersByClient(ctx, args.clientId);
    },
});

export const listFoldersByParent = query({
    args: {
        clientId: v.id("clients"),
        parentId: v.optional(v.id("kbFolders")),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return KBRead.listFoldersByParent(ctx, args.clientId, args.parentId);
    },
});

export const getFolderAncestors = query({
    args: { folderId: v.id("kbFolders") },
    handler: async (ctx, args) => {
        const folder = await KBRead.getFolderById(ctx, args.folderId);
        if (!folder) return [];
        await requireClientAccess(ctx, folder.clientId);

        const ancestors: Array<{ _id: typeof args.folderId; name: string }> = [];
        let current = folder;
        while (current) {
            ancestors.unshift({ _id: current._id, name: current.name });
            if (current.parentId) {
                const parent = await KBRead.getFolderById(ctx, current.parentId);
                if (!parent) break;
                current = parent;
            } else {
                break;
            }
        }
        return ancestors;
    },
});

// --- Folder Mutations ---

export const createFolder = mutation({
    args: {
        clientId: v.id("clients"),
        name: v.string(),
        description: v.optional(v.string()),
        parentId: v.optional(v.id("kbFolders")),
    },
    handler: async (ctx, args) => {
        const client = await requireClientAccess(ctx, args.clientId);

        // Get next sort order
        const siblings = await KBRead.listFoldersByParent(
            ctx,
            args.clientId,
            args.parentId,
        );
        const maxSort = siblings.reduce(
            (max, f) => Math.max(max, f.sortOrder),
            0,
        );

        return KBWrite.createFolder(ctx, {
            clientId: args.clientId,
            name: args.name,
            description: args.description,
            parentId: args.parentId,
            sortOrder: maxSort + 1,
            createdBy: client.userId,
        });
    },
});

export const updateFolder = mutation({
    args: {
        folderId: v.id("kbFolders"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const folder = await KBRead.getFolderById(ctx, args.folderId);
        if (!folder) throw new Error("Folder not found");

        await requireClientAccess(ctx, folder.clientId);

        const patch: Record<string, unknown> = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.description !== undefined) patch.description = args.description;

        await KBWrite.patchFolder(ctx, args.folderId, patch);
        return { success: true };
    },
});

export const removeFolder = mutation({
    args: { folderId: v.id("kbFolders") },
    handler: async (ctx, args) => {
        const folder = await KBRead.getFolderById(ctx, args.folderId);
        if (!folder) throw new Error("Folder not found");

        await requireClientAccess(ctx, folder.clientId);

        // Move docs in this folder to no folder
        const docs = await KBRead.listDocumentsByFolder(
            ctx,
            folder.clientId,
            args.folderId,
        );
        for (const doc of docs) {
            await KBWrite.patchDocument(ctx, doc._id, { folderId: undefined });
        }

        await KBWrite.deleteFolder(ctx, args.folderId);
        return { success: true };
    },
});

// --- Document Move ---

export const moveDocument = mutation({
    args: {
        documentId: v.id("kbDocuments"),
        folderId: v.optional(v.id("kbFolders")),
    },
    handler: async (ctx, args) => {
        const doc = await KBRead.getDocumentById(ctx, args.documentId);
        if (!doc) throw new Error("Document not found");
        await requireClientAccess(ctx, doc.clientId);

        // Validate target folder belongs to same client
        if (args.folderId) {
            const folder = await KBRead.getFolderById(ctx, args.folderId);
            if (!folder || folder.clientId !== doc.clientId) {
                throw new Error("Folder not found");
            }
        }

        await KBWrite.patchDocument(ctx, args.documentId, {
            folderId: args.folderId,
        });
        return { success: true };
    },
});

// --- Stats ---

export const getStats = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        const docs = await KBRead.listDocumentsByClient(ctx, args.clientId, 10000);
        const folders = await KBRead.listFoldersByClient(ctx, args.clientId);

        let totalChars = 0;
        let ready = 0;
        let pending = 0;
        let failed = 0;
        for (const doc of docs) {
            if (doc.charCount) totalChars += doc.charCount;
            if (doc.processingStatus === "ready") ready++;
            else if (doc.processingStatus === "failed") failed++;
            else pending++;
        }

        return {
            totalDocuments: docs.length,
            ready,
            pending,
            failed,
            totalChars,
            folderCount: folders.length,
        };
    },
});

// --- Document Content Update ---

export const updateDocumentContent = mutation({
    args: {
        documentId: v.id("kbDocuments"),
        rawText: v.string(),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const doc = await KBRead.getDocumentById(ctx, args.documentId);
        if (!doc) throw new Error("Document not found");

        await requireClientAccess(ctx, doc.clientId);

        const patch: Record<string, unknown> = {
            rawText: args.rawText,
            charCount: args.rawText.length,
            processingStatus: "pending",
        };
        if (args.title !== undefined) {
            patch.title = args.title;
        }
        await KBWrite.patchDocument(ctx, args.documentId, patch);

        await ctx.scheduler.runAfter(
            0,
            internal.knowledgeBaseActions.reindexDocument,
            { documentId: args.documentId },
        );

        return { success: true };
    },
});

// --- Internal Mutations (called from actions) ---

export const setDocumentText = internalMutation({
    args: {
        documentId: v.id("kbDocuments"),
        rawText: v.string(),
        charCount: v.number(),
    },
    handler: async (ctx, args) => {
        await KBWrite.patchDocument(ctx, args.documentId, {
            rawText: args.rawText,
            charCount: args.charCount,
            processingStatus: "embedding",
        });
    },
});

export const setDocumentReady = internalMutation({
    args: {
        documentId: v.id("kbDocuments"),
        ragEntryId: v.optional(v.string()),
        chunkCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const patch: Record<string, unknown> = {
            processingStatus: "ready",
        };
        if (args.chunkCount !== undefined) {
            patch.chunkCount = args.chunkCount;
        }
        await KBWrite.patchDocument(ctx, args.documentId, patch);
    },
});

export const setDocumentFailed = internalMutation({
    args: {
        documentId: v.id("kbDocuments"),
        processingError: v.string(),
    },
    handler: async (ctx, args) => {
        await KBWrite.patchDocument(ctx, args.documentId, {
            processingStatus: "failed",
            processingError: args.processingError,
        });
    },
});

// Internal query for admin operations (no auth — only callable by other Convex functions)
export const listDocumentsInternal = internalQuery({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        return KBRead.listDocumentsByClient(ctx, args.clientId, 10000);
    },
});

// Internal query for actions to fetch document data
export const getDocumentInternal = query({
    args: { documentId: v.id("kbDocuments") },
    handler: async (ctx, args) => {
        return KBRead.getDocumentById(ctx, args.documentId);
    },
});
