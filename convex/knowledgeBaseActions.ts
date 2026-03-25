"use node";

import { v } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { rag, ragSearch } from "./_lib/rag";
import { extractText, getDocumentProxy } from "unpdf";

function estimateTokens(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    // Approximation used when provider usage metadata is unavailable.
    return Math.ceil(trimmed.length / 4);
}

export const processDocument = internalAction({
    args: { documentId: v.id("kbDocuments") },
    handler: async (ctx, args) => {
        const doc = await ctx.runQuery(api.knowledgeBase.getDocumentInternal, {
            documentId: args.documentId,
        });
        if (!doc) {
            console.error(
                `processDocument: document ${args.documentId} not found`,
            );
            return;
        }

        try {
            let text = doc.rawText ?? "";

            // Extract text from uploaded file if needed
            if (doc.sourceType === "upload" && doc.storageId) {
                // Update status to extracting
                await ctx.runMutation(internal.knowledgeBase.setDocumentText, {
                    documentId: args.documentId,
                    rawText: "",
                    charCount: 0,
                });

                const blob = await ctx.storage.get(doc.storageId);
                if (!blob) {
                    throw new Error("File not found in storage");
                }

                const arrayBuffer = await blob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                switch (doc.fileType) {
                    case "pdf": {
                        const pdf = await getDocumentProxy(
                            new Uint8Array(arrayBuffer),
                        );
                        const { text: pdfText } = await extractText(pdf, {
                            mergePages: true,
                        });
                        text = pdfText;
                        break;
                    }
                    case "csv": {
                        const csvText = buffer.toString("utf-8");
                        text = parseCsvToReadableText(csvText);
                        break;
                    }
                    case "markdown":
                    case "txt":
                    default: {
                        text = buffer.toString("utf-8");
                        break;
                    }
                }
            }

            if (!text || text.trim().length === 0) {
                throw new Error(
                    "No text content could be extracted from the file",
                );
            }

            // Save extracted text and update status to embedding
            await ctx.runMutation(internal.knowledgeBase.setDocumentText, {
                documentId: args.documentId,
                rawText: text,
                charCount: text.length,
            });

            // Add to RAG with clientId as namespace for tenant isolation
            const ragResult = await rag.add(ctx, {
                namespace: doc.clientId,
                key: args.documentId,
                title: doc.title,
                text,
            });

            // Track embedding usage
            try {
                const providerTokens = Number(ragResult.usage?.tokens);
                const embeddingTokens = Number.isFinite(providerTokens)
                    ? providerTokens
                    : estimateTokens(text);
                await ctx.runMutation(internal.usage.trackUsage, {
                    clientId: doc.clientId as Id<"clients">,
                    service: "kb_embedding",
                    callCount: 1,
                    promptTokens: embeddingTokens,
                });
            } catch (e) {
                console.error("KB embedding usage tracking failed:", e);
            }

            // Mark as ready with estimated chunk count
            const chunkCount = Math.ceil(text.length / 1000);
            await ctx.runMutation(internal.knowledgeBase.setDocumentReady, {
                documentId: args.documentId,
                chunkCount,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown processing error";

            console.error(
                `processDocument failed for ${args.documentId}:`,
                message,
            );

            await ctx.runMutation(internal.knowledgeBase.setDocumentFailed, {
                documentId: args.documentId,
                processingError: message.slice(0, 500),
            });
        }
    },
});

export const reindexDocument = internalAction({
    args: { documentId: v.id("kbDocuments") },
    handler: async (ctx, args) => {
        const doc = await ctx.runQuery(api.knowledgeBase.getDocumentInternal, {
            documentId: args.documentId,
        });
        if (!doc) {
            console.error(
                `reindexDocument: document ${args.documentId} not found`,
            );
            return;
        }

        try {
            const text = doc.rawText ?? "";
            if (!text.trim()) {
                throw new Error("Document has no text content to index");
            }

            // Re-add to RAG — same key replaces old chunks automatically
            const ragResult = await rag.add(ctx, {
                namespace: doc.clientId,
                key: args.documentId,
                title: doc.title,
                text,
            });

            // Track embedding usage
            try {
                const providerTokens = Number(ragResult.usage?.tokens);
                const embeddingTokens = Number.isFinite(providerTokens)
                    ? providerTokens
                    : estimateTokens(text);
                await ctx.runMutation(internal.usage.trackUsage, {
                    clientId: doc.clientId as Id<"clients">,
                    service: "kb_embedding",
                    callCount: 1,
                    promptTokens: embeddingTokens,
                });
            } catch (e) {
                console.error("KB embedding usage tracking failed:", e);
            }

            const chunkCount = Math.ceil(text.length / 1000);
            await ctx.runMutation(internal.knowledgeBase.setDocumentReady, {
                documentId: args.documentId,
                chunkCount,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown re-indexing error";

            console.error(
                `reindexDocument failed for ${args.documentId}:`,
                message,
            );

            await ctx.runMutation(internal.knowledgeBase.setDocumentFailed, {
                documentId: args.documentId,
                processingError: message.slice(0, 500),
            });
        }
    },
});

export const searchKnowledgeBase = action({
    args: {
        clientId: v.id("clients"),
        query: v.string(),
    },
    handler: async (ctx, args) => {
        // Auth check — verify the caller has access to this client
        await ctx.runQuery(api.knowledgeBase.listDocuments, {
            clientId: args.clientId,
        });

        const results = await ragSearch.search(ctx, {
            namespace: args.clientId,
            query: args.query,
            limit: 8,
            searchType: "hybrid",
            chunkContext: { before: 1, after: 1 },
        });

        return {
            text: results.text,
            results: results.results.map((r) => ({
                text: r.content.map((c) => c.text).join("\n"),
                score: r.score,
            })),
            entries: results.entries.map((e) => ({
                title: e.title,
                key: e.key,
            })),
        };
    },
});

export const reprocessAllDocuments = internalAction({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args): Promise<{ reprocessed: number }> => {
        const documents = await ctx.runQuery(
            internal.knowledgeBase.listDocumentsInternal,
            {
                clientId: args.clientId,
            },
        );

        const ready = documents.filter(
            (d: { processingStatus: string }) =>
                d.processingStatus === "ready" ||
                d.processingStatus === "failed",
        );

        for (const doc of ready) {
            // Reset status to pending, then re-schedule processing
            await ctx.runMutation(internal.knowledgeBase.setDocumentText, {
                documentId: doc._id,
                rawText: doc.rawText ?? "",
                charCount: doc.charCount ?? 0,
            });
            await ctx.scheduler.runAfter(
                0,
                internal.knowledgeBaseActions.processDocument,
                { documentId: doc._id },
            );
        }

        return { reprocessed: ready.length };
    },
});

export const deleteRagEntry = internalAction({
    args: {
        documentId: v.id("kbDocuments"),
        clientId: v.id("clients"),
    },
    handler: async (ctx, args) => {
        try {
            const ns = await rag.getNamespace(ctx, {
                namespace: args.clientId,
            });
            if (ns) {
                await rag.deleteByKey(ctx, {
                    namespaceId: ns.namespaceId,
                    key: args.documentId,
                });
            }
        } catch (error) {
            console.error(
                `deleteRagEntry failed for ${args.documentId}:`,
                error,
            );
        }
    },
});

/**
 * Convert CSV text into human-readable paragraphs for better RAG retrieval.
 * Each row becomes a short passage referencing column headers.
 */
function parseCsvToReadableText(csvText: string): string {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return csvText;

    const headers = parseCSVLine(lines[0]);
    const passages: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const parts: string[] = [];
        for (let j = 0; j < headers.length && j < values.length; j++) {
            const val = values[j].trim();
            if (val) {
                parts.push(`${headers[j].trim()}: ${val}`);
            }
        }
        if (parts.length > 0) {
            passages.push(`Row ${i}: ${parts.join(", ")}.`);
        }
    }

    return passages.join("\n");
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}
