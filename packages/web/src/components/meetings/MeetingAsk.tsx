"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Citation {
  meetingId: string;
  chunkIndex: number;
  text: string;
}

interface AskResponse {
  answer: string;
  citations: Citation[];
}

interface MeetingAskProps {
  projectId: string;
  /** When provided, the user can scope the question to just this meeting. */
  meetingId?: string;
}

/**
 * "Ask about your meetings" box — posts to /api/meetings/ask (RAG Q&A over the
 * transcript embeddings) and renders the answer with citations.
 */
export function MeetingAsk({ projectId, meetingId }: MeetingAskProps) {
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<"all" | "meeting">(meetingId ? "meeting" : "all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/meetings/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          projectId,
          meetingId: scope === "meeting" ? meetingId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get an answer");
      setResult(data as AskResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask about your meetings
        </CardTitle>
        {meetingId && (
          <div className="flex rounded-md border p-0.5">
            {(["meeting", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  scope === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "meeting" ? "This meeting" : "All meetings"}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="e.g. What did we decide about the kitchen timeline?"
            disabled={loading}
          />
          <Button onClick={submit} disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result.answer}</p>

            {result.citations.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</div>
                {result.citations.map((c, i) => (
                  <div
                    key={`${c.meetingId}-${c.chunkIndex}`}
                    className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                  >
                    <span className="mr-1.5 font-semibold text-primary">[{i + 1}]</span>
                    {c.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MeetingAsk;
