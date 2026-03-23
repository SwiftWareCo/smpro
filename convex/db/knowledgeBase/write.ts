import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

// --- KB Documents ---

export async function createDocument(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        folderId?: Id<"kbFolders">;
        title: string;
        description?: string;
        sourceType: "upload" | "manual";
        fileType?: "pdf" | "markdown" | "csv" | "txt";
        storageId?: Id<"_storage">;
        rawText?: string;
        charCount?: number;
        processingStatus: "pending" | "extracting" | "embedding" | "ready" | "failed";
        createdBy: string;
    },
) {
    const now = Date.now();
    return ctx.db.insert("kbDocuments", {
        clientId: data.clientId,
        folderId: data.folderId,
        title: data.title,
        description: data.description,
        sourceType: data.sourceType,
        fileType: data.fileType,
        storageId: data.storageId,
        rawText: data.rawText,
        charCount: data.charCount,
        processingStatus: data.processingStatus,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
    });
}

export async function patchDocument(
    ctx: MutationCtx,
    documentId: Id<"kbDocuments">,
    patch: Record<string, unknown>,
) {
    const doc = await ctx.db.get(documentId);
    if (!doc) return null;
    await ctx.db.patch(documentId, { ...patch, updatedAt: Date.now() });
    return doc;
}

export async function deleteDocument(
    ctx: MutationCtx,
    documentId: Id<"kbDocuments">,
) {
    const doc = await ctx.db.get(documentId);
    if (!doc) return null;
    await ctx.db.delete(documentId);
    return doc;
}

// --- KB Folders ---

export async function createFolder(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        name: string;
        description?: string;
        parentId?: Id<"kbFolders">;
        sortOrder: number;
        createdBy: string;
    },
) {
    const now = Date.now();
    return ctx.db.insert("kbFolders", {
        clientId: data.clientId,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
    });
}

export async function patchFolder(
    ctx: MutationCtx,
    folderId: Id<"kbFolders">,
    patch: Record<string, unknown>,
) {
    const folder = await ctx.db.get(folderId);
    if (!folder) return null;
    await ctx.db.patch(folderId, { ...patch, updatedAt: Date.now() });
    return folder;
}

export async function deleteFolder(
    ctx: MutationCtx,
    folderId: Id<"kbFolders">,
) {
    const folder = await ctx.db.get(folderId);
    if (!folder) return null;
    await ctx.db.delete(folderId);
    return folder;
}

// --- KB Threads ---

export async function createThread(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        agentThreadId: string;
        title?: string;
        userId: string;
        lastMessageAt: number;
    },
) {
    return ctx.db.insert("kbThreads", {
        clientId: data.clientId,
        agentThreadId: data.agentThreadId,
        title: data.title,
        userId: data.userId,
        lastMessageAt: data.lastMessageAt,
    });
}

export async function patchThread(
    ctx: MutationCtx,
    threadId: Id<"kbThreads">,
    patch: Record<string, unknown>,
) {
    const thread = await ctx.db.get(threadId);
    if (!thread) return null;
    await ctx.db.patch(threadId, patch);
    return thread;
}

export async function deleteThread(
    ctx: MutationCtx,
    threadId: Id<"kbThreads">,
) {
    const thread = await ctx.db.get(threadId);
    if (!thread) return null;
    await ctx.db.delete(threadId);
    return thread;
}
