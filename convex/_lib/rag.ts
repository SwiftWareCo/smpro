import { RAG } from "@convex-dev/rag";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { wrapEmbeddingModel, defaultEmbeddingSettingsMiddleware } from "ai";
import { components } from "../_generated/api";

const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const baseModel = googleAI.textEmbeddingModel("gemini-embedding-2-preview");

// For indexing (rag.add / rag.deleteByKey) — RETRIEVAL_DOCUMENT optimizes embeddings to be *found*
export const rag = new RAG(components.rag, {
    textEmbeddingModel: wrapEmbeddingModel({
        model: baseModel,
        middleware: defaultEmbeddingSettingsMiddleware({
            settings: {
                providerOptions: {
                    google: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 },
                },
            },
        }),
    }),
    embeddingDimension: 768,
});

// For searching (ragSearch.search) — RETRIEVAL_QUERY optimizes embeddings to *find* documents
export const ragSearch = new RAG(components.rag, {
    textEmbeddingModel: wrapEmbeddingModel({
        model: baseModel,
        middleware: defaultEmbeddingSettingsMiddleware({
            settings: {
                providerOptions: {
                    google: { taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 },
                },
            },
        }),
    }),
    embeddingDimension: 768,
});
