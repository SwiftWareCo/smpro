import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./_lib/auth";
import * as AccountsRead from "./db/accounts/read";
import * as AccountsWrite from "./db/accounts/write";
import * as ClientsRead from "./db/clients/read";
import * as ClientsWrite from "./db/clients/write";
import * as ContentWrite from "./db/content/write";
import * as SeoRead from "./db/seo/read";

type ChecklistItem = {
    id: string;
    label: string;
    completed: boolean;
    module: "base" | "social" | "seo" | "assets";
};

type SetupStatus = {
    items: ChecklistItem[];
    completedCount: number;
    totalCount: number;
    percentage: number;
};

const CHECKLIST_RULES = {
    base: [
        {
            id: "client-avatar",
            label: "Add client avatar",
            module: "base" as const,
        },
        {
            id: "client-description",
            label: "Add client description",
            module: "base" as const,
        },
    ],
    social: [
        {
            id: "instagram-connected",
            label: "Connect Instagram account",
            module: "social" as const,
        },
        {
            id: "facebook-connected",
            label: "Connect Facebook account",
            module: "social" as const,
        },
    ],
    seo: [
        { id: "website-url", label: "Add website URL", module: "seo" as const },
        {
            id: "target-keywords",
            label: "Set target keywords",
            module: "seo" as const,
        },
        {
            id: "target-locations",
            label: "Set target locations",
            module: "seo" as const,
        },
    ],
    assets: [
        {
            id: "logo-uploaded",
            label: "Upload logo",
            module: "assets" as const,
        },
        {
            id: "brand-colors",
            label: "Set brand colors",
            module: "assets" as const,
        },
    ],
};

function evaluateChecklist(
    client: {
        avatarUrl?: string | null;
        description?: string | null;
        enabledModules?: string[] | null;
    },
    seoData: {
        websiteUrl?: string | null;
        targetKeywords?: string[] | null;
        targetLocations?: string[] | null;
    } | null,
    accountCounts: { instagram: number; facebook: number },
): ChecklistItem[] {
    const enabledModules = client.enabledModules || ["social"];
    const items: ChecklistItem[] = [];

    items.push({
        ...CHECKLIST_RULES.base[0],
        completed: !!client.avatarUrl,
    });
    items.push({
        ...CHECKLIST_RULES.base[1],
        completed: !!client.description,
    });

    if (enabledModules.includes("social")) {
        items.push({
            ...CHECKLIST_RULES.social[0],
            completed: accountCounts.instagram > 0,
        });
        items.push({
            ...CHECKLIST_RULES.social[1],
            completed: accountCounts.facebook > 0,
        });
    }

    if (enabledModules.includes("seo")) {
        items.push({
            ...CHECKLIST_RULES.seo[0],
            completed: !!seoData?.websiteUrl,
        });
        items.push({
            ...CHECKLIST_RULES.seo[1],
            completed: (seoData?.targetKeywords?.length ?? 0) > 0,
        });
        items.push({
            ...CHECKLIST_RULES.seo[2],
            completed: (seoData?.targetLocations?.length ?? 0) > 0,
        });
    }

    if (enabledModules.includes("assets")) {
        items.push({ ...CHECKLIST_RULES.assets[0], completed: false });
        items.push({ ...CHECKLIST_RULES.assets[1], completed: false });
    }

    return items;
}

function buildSetupStatus(items: ChecklistItem[]): SetupStatus {
    const completedCount = items.filter((item) => item.completed).length;
    const totalCount = items.length;
    const percentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
    return {
        items,
        completedCount,
        totalCount,
        percentage,
    };
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);
        return ClientsRead.listByUser(ctx, userId);
    },
});

export const get = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client) return null;
        if (client.userId !== userId) {
            throw new Error("Unauthorized");
        }
        return client;
    },
});

export const getSummary = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return null;
        }
        return {
            _id: client._id,
            avatarUrl: client.avatarUrl ?? null,
            description: client.description ?? null,
            enabledModules: client.enabledModules ?? null,
        };
    },
});

export const create = mutation({
    args: { name: v.string(), description: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        return ClientsWrite.create(ctx, userId, {
            name: args.name,
            description: args.description ?? null,
        });
    },
});

export const update = mutation({
    args: {
        clientId: v.id("clients"),
        name: v.optional(v.string()),
        description: v.optional(v.union(v.string(), v.null())),
        avatarUrl: v.optional(v.union(v.string(), v.null())),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Client not found");
        }

        const patch: Record<string, unknown> = {
            updatedAt: Date.now(),
        };
        if (args.name !== undefined) patch.name = args.name;
        if (args.description !== undefined)
            patch.description = args.description;
        if (args.avatarUrl !== undefined) patch.avatarUrl = args.avatarUrl;
        if (args.status !== undefined) patch.status = args.status;

        await ClientsWrite.patchById(ctx, client._id, patch);
        return { success: true };
    },
});

export const updateModules = mutation({
    args: { clientId: v.id("clients"), modules: v.array(v.string()) },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Client not found");
        }
        await ClientsWrite.patchById(ctx, client._id, {
            enabledModules: args.modules,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});

export const updateStatus = mutation({
    args: {
        clientId: v.id("clients"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Client not found");
        }
        await ClientsWrite.patchById(ctx, client._id, {
            status: args.status,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});

export const remove = mutation({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            throw new Error("Client not found");
        }

        const accounts = await AccountsRead.listByClient(
            ctx,
            userId,
            args.clientId,
        );
        for (const account of accounts) {
            await ContentWrite.deleteByAccountId(ctx, account._id);
            await AccountsWrite.removeById(ctx, account._id);
        }

        await ClientsWrite.removeById(ctx, client._id);
        return { success: true };
    },
});

export const getSetupStatus = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const client = await ClientsRead.getById(ctx, args.clientId);
        if (!client || client.userId !== userId) {
            return buildSetupStatus([]);
        }

        const [seoData, accountCounts] = await Promise.all([
            SeoRead.getByClient(ctx, args.clientId),
            AccountsRead.countByPlatform(ctx, userId, args.clientId),
        ]);

        const items = evaluateChecklist(
            client,
            seoData
                ? {
                      websiteUrl: seoData.websiteUrl ?? null,
                      targetKeywords: seoData.targetKeywords ?? null,
                      targetLocations: seoData.targetLocations ?? null,
                  }
                : null,
            accountCounts,
        );

        return buildSetupStatus(items);
    },
});

export const getSetupStatuses = query({
    args: { clientIds: v.array(v.id("clients")) },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const results: Array<{ clientId: string; status: SetupStatus }> = [];

        for (const clientId of args.clientIds) {
            const client = await ClientsRead.getById(ctx, clientId);
            if (!client || client.userId !== userId) {
                results.push({ clientId, status: buildSetupStatus([]) });
                continue;
            }

            const [seoData, accountCounts] = await Promise.all([
                SeoRead.getByClient(ctx, clientId),
                AccountsRead.countByPlatform(ctx, userId, clientId),
            ]);

            const items = evaluateChecklist(
                client,
                seoData
                    ? {
                          websiteUrl: seoData.websiteUrl ?? null,
                          targetKeywords: seoData.targetKeywords ?? null,
                          targetLocations: seoData.targetLocations ?? null,
                      }
                    : null,
                accountCounts,
            );

            results.push({ clientId, status: buildSetupStatus(items) });
        }

        return results;
    },
});
