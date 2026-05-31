import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askWorker } from "@/lib/services/meeting-worker-client";

const askSchema = z.object({
  question: z.string().min(1, { message: "question is required" }),
  projectId: z.string().optional(),
  meetingId: z.string().optional(),
  topK: z.number().int().positive().max(20).optional(),
});

/**
 * POST /api/meetings/ask
 * Thin authenticated proxy to the meeting-worker's /ask (RAG Q&A).
 * The worker does the embedding + Qdrant search + LLM answer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const result = await askWorker(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/meetings/ask:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to answer question" },
      { status: 500 }
    );
  }
}
