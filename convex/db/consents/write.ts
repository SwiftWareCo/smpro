import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function create(
    ctx: MutationCtx,
    data: {
        clientId: Id<"clients">;
        submissionId?: Id<"formSubmissions">;
        consentVersion: string;
        consentTextSnapshot: string;
        purposes: string[];
        givenByIp?: string;
    },
) {
    const now = Date.now();
    return ctx.db.insert("consentRecords", {
        clientId: data.clientId,
        submissionId: data.submissionId,
        consentVersion: data.consentVersion,
        consentTextSnapshot: data.consentTextSnapshot,
        purposes: data.purposes,
        givenAt: now,
        givenByIp: data.givenByIp,
        withdrawn: false,
        createdAt: now,
    });
}
