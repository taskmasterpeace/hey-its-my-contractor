import { generateObject, generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { config } from "./config.js";
import { withRetry } from "./retry.js";

const openrouter = createOpenRouter({ apiKey: config.openrouter.apiKey });
const model = openrouter(config.openrouter.model);

const summarySchema = z.object({
  summary: z
    .string()
    .describe("2-4 sentence plain-language summary of what the meeting was about and what was decided"),
  actionItems: z
    .array(z.string())
    .describe("Concrete decisions, commitments, and next steps, each as a short sentence"),
});

export type MeetingSummary = z.infer<typeof summarySchema>;

/** Generate a summary + action items from a raw meeting transcript. */
export async function summarizeTranscript(transcript: string): Promise<MeetingSummary> {
  return withRetry(
    async () => {
      const { object } = await generateObject({
        model,
        schema: summarySchema,
        prompt: `You are assisting a construction contractor. Read this meeting transcript and extract a concise summary and the concrete action items / decisions. Be specific (names, dates, dollar amounts, materials) when present. If nothing was decided, return an empty actionItems array.\n\nTranscript:\n"""\n${transcript}\n"""`,
      });
      return object;
    },
    { label: "llm.summarize" }
  );
}

export interface Citation {
  meetingId: string;
  chunkIndex: number;
  text: string;
}

export interface Answer {
  answer: string;
  citations: Citation[];
}

/** Answer a question grounded in retrieved transcript chunks. */
export async function answerQuestion(
  question: string,
  chunks: Citation[]
): Promise<Answer> {
  if (chunks.length === 0) {
    return {
      answer:
        "I couldn't find anything about that in your meeting transcripts.",
      citations: [],
    };
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] (meeting ${c.meetingId})\n${c.text}`)
    .join("\n\n");

  const answer = await withRetry(
    async () => {
      const { text } = await generateText({
        model,
        prompt: `Answer the contractor's question using ONLY the meeting excerpts below. Cite the excerpts you used with their bracket numbers like [1], [2]. If the excerpts don't contain the answer, say so plainly.\n\nExcerpts:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
      });
      return text;
    },
    { label: "llm.answer" }
  );

  return { answer, citations: chunks };
}
