import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { config } from "./config.js";

// Load the model once and reuse. This is the whole reason the worker is a
// long-lived container instead of a serverless function.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", "Supabase/gte-small");
  }
  return extractorPromise;
}

/** Warm the model at boot so the first request isn't slow. */
export async function warmEmbedder(): Promise<void> {
  await getExtractor();
}

/** Embed a single string into a 384-dim normalized vector. */
export async function embed(textInput: string): Promise<number[]> {
  if (!textInput || typeof textInput !== "string") {
    throw new Error("embed() requires a non-empty string");
  }
  const extractor = await getExtractor();
  const result = await extractor(textInput, { pooling: "mean", normalize: true });
  const vector = Array.from(result.data as Float32Array);
  if (vector.length !== config.embeddingDim) {
    throw new Error(
      `Unexpected embedding dim ${vector.length}, expected ${config.embeddingDim}`
    );
  }
  return vector;
}
