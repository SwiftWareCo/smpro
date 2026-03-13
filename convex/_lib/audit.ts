import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface AuditEvent {
    actor: string;
    actorType: "user" | "system" | "patient";
    action: string;
    resource: string;
    resourceId?: string;
    clientId?: Id<"clients">;
    ip?: string;
    metadata?: Record<string, unknown>;
}

export async function logAuditEvent(ctx: MutationCtx, event: AuditEvent) {
    await ctx.db.insert("auditLogs", {
        actor: event.actor,
        actorType: event.actorType,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        clientId: event.clientId,
        ip: event.ip,
        metadata: event.metadata,
        timestamp: Date.now(),
    });
}
