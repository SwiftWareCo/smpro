import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

// --- KB Documents ---

export async function getDocumentById(
    ctx: QueryCtx,
    documentId: Id<"kbDocuments">,
) {
    return ctx.db.get(documentId);
}

export async function listDocumentsByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    limit = 100,
) {
    return ctx.db
        .query("kbDocuments")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("desc")
        .take(limit);
}

export async function listDocumentsByFolder(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    folderId: Id<"kbFolders"> | undefined,
    limit = 100,
) {
    return ctx.db
        .query("kbDocuments")
        .withIndex("by_client_folder", (q) =>
            q.eq("clientId", clientId).eq("folderId", folderId),
        )
        .order("desc")
        .take(limit);
}

export async function listDocumentsByStatus(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    status: string,
    limit = 100,
) {
    return ctx.db
        .query("kbDocuments")
        .withIndex("by_client_status", (q) =>
            q.eq("clientId", clientId).eq("processingStatus", status as never),
        )
        .order("desc")
        .take(limit);
}

// --- KB Folders ---

export async function getFolderById(
    ctx: QueryCtx,
    folderId: Id<"kbFolders">,
) {
    return ctx.db.get(folderId);
}

export async function listFoldersByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("kbFolders")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .order("asc")
        .collect();
}

export async function listFoldersByParent(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    parentId: Id<"kbFolders"> | undefined,
) {
    return ctx.db
        .query("kbFolders")
        .withIndex("by_client_parent", (q) =>
            q.eq("clientId", clientId).eq("parentId", parentId),
        )
        .order("asc")
        .collect();
}
