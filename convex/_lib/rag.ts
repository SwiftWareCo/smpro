import { RAG } from "@convex-dev/rag";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { components } from "../_generated/api";

const googleAI = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const rag = new RAG(components.rag, {
    textEmbeddingModel: googleAI.textEmbeddingModel("gemini-embedding-2-preview"),
    embeddingDimension: 3072,
});
