import { embed } from "./embedding.js";
import { search } from "./qdrant.js";
import { answerQuestion, type Answer } from "./llm.js";

/**
 * RAG Q&A: embed the question, retrieve the most relevant transcript chunks
 * (scoped to a project and optionally a single meeting), then have the LLM
 * answer with citations.
 */
export async function ask(params: {
  question: string;
  projectId?: string;
  meetingId?: string;
  topK?: number;
}): Promise<Answer> {
  const vector = await embed(params.question);
  const hits = await search(vector, {
    projectId: params.projectId,
    meetingId: params.meetingId,
    topK: params.topK ?? 6,
  });
  return answerQuestion(
    params.question,
    hits.map((h) => ({
      meetingId: h.meetingId,
      chunkIndex: h.chunkIndex,
      text: h.text,
    }))
  );
}
