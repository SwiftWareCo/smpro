import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireClientAccess, requireUserId } from "./_lib/auth";
import * as AuditRead from "./db/audit/read";
import * as AuditWrite from "./db/audit/write";

export const log = mutation({
    args: {
        action: v.string(),
        resource: v.string(),
        resourceId: v.optional(v.string()),
        clientId: v.optional(v.id("clients")),
        ip: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        return AuditWrite.create(ctx, {
            actor: userId,
            actorType: "user",
            action: args.action,
            resource: args.resource,
            resourceId: args.resourceId,
            clientId: args.clientId,
            ip: args.ip,
            metadata: args.metadata,
        });
    },
});

export const listByClient = query({
    args: {
        clientId: v.id("clients"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        return AuditRead.listByClient(ctx, args.clientId, args.limit ?? 50);
    },
});

export const listByResource = query({
    args: {
        clientId: v.id("clients"),
        resource: v.string(),
        resourceId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireClientAccess(ctx, args.clientId);
        const logs = await AuditRead.listByResource(
            ctx,
            args.resource,
            args.resourceId,
            args.limit ?? 50,
        );
        return logs.filter((log) => log.clientId === args.clientId);
    },
});
