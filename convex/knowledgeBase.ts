import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
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
    },
    handler: async (ctx, args) => {
        await KBWrite.patchDocument(ctx, args.documentId, {
            processingStatus: "ready",
        });
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

// Internal query for actions to fetch document data
export const getDocumentInternal = query({
    args: { documentId: v.id("kbDocuments") },
    handler: async (ctx, args) => {
        return KBRead.getDocumentById(ctx, args.documentId);
    },
});
