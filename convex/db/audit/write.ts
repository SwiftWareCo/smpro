import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function create(
    ctx: MutationCtx,
    data: {
        actor: string;
        actorType: "user" | "system" | "patient";
        action: string;
        resource: string;
        resourceId?: string;
        clientId?: Id<"clients">;
        ip?: string;
        metadata?: Record<string, unknown>;
    },
) {
    return ctx.db.insert("auditLogs", {
        ...data,
        timestamp: Date.now(),
    });
}
