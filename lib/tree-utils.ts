/**
 * Client-side cycle detection for folder moves.
 * Returns true if `folderId` is an ancestor of `targetId` (moving folderId
 * into targetId would create a cycle).
 */
export function isDescendantOf(
    folderId: string,
    targetId: string,
    folders: Array<{ _id: string; parentId?: string }>,
): boolean {
    const folderMap = new Map(folders.map((f) => [f._id, f]));
    let current = folderMap.get(targetId);
    while (current) {
        if (current._id === folderId) return true;
        if (!current.parentId) break;
        current = folderMap.get(current.parentId);
    }
    return false;
}
