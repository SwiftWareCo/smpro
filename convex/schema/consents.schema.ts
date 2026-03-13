import { defineTable } from "convex/server";
import { v } from "convex/values";

export const consentRecords = defineTable({
    clientId: v.id("clients"),
    submissionId: v.optional(v.id("formSubmissions")),
    consentVersion: v.string(),
    consentTextSnapshot: v.string(),
    purposes: v.array(v.string()),
    givenAt: v.number(),
    givenByIp: v.optional(v.string()),
    withdrawn: v.boolean(),
    withdrawnAt: v.optional(v.number()),
    createdAt: v.number(),
})
    .index("by_client_id", ["clientId"])
    .index("by_submission_id", ["submissionId"]);
