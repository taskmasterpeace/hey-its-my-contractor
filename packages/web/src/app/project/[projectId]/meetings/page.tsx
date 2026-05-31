"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Mic, Loader2, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeetingAsk } from "@/components/meetings/MeetingAsk";
import { MeetingRecorderPanel } from "@/components/meetings/MeetingRecorderPanel";
import { MeetingAudioPlayer } from "@/components/meetings/MeetingAudioPlayer";

interface TranscriptSegment {
  start: number;
  speaker: string;
  text: string;
}

interface MeetingData {
  id: string;
  title: string;
  startsAt: string;
  type: string;
  status: string;
  recordingUrl: string | null;
  transcriptStatus: string | null;
}

interface TranscriptData {
  text: string | null;
  segments: TranscriptSegment[];
  summary: string | null;
  actionItems: string[];
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "cancelled") return "destructive";
  return "secondary";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d: string) {
  return (
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export default function ProjectMeetingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchTranscript = useCallback(
    async (meetingId: string): Promise<TranscriptData | null> => {
      const res = await fetch(`/api/project/${projectId}/meetings/${meetingId}/transcript`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.transcript || null;
    },
    [projectId]
  );

  // Load meetings + the selected (newest) meeting's transcript.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/project/${projectId}/meetings`);
        if (!res.ok) return;
        const json = await res.json();
        const raw = json.data || json.meetings || [];
        const mtgs: MeetingData[] = raw
          .map((m: any) => ({
            id: m.id,
            title: m.title,
            startsAt: m.starts_at || m.startsAt,
            type: m.type,
            status: m.status,
            recordingUrl: m.recording_url || m.recordingUrl || null,
            transcriptStatus: m.transcript_status || m.transcriptStatus || null,
          }))
          .sort((a: MeetingData, b: MeetingData) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
        if (!active) return;
        setMeetings(mtgs);

        // Keep current selection if it still exists; otherwise pick the newest.
        const next = (meeting && mtgs.find((m) => m.id === meeting.id)) || mtgs[0] || null;
        if (next) {
          setMeeting(next);
          const t = await fetchTranscript(next.id);
          if (active) setTranscript(t);
        }
      } catch (e) {
        console.error("Failed to load meetings:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadKey]);

  // Poll while the selected meeting is still processing, so it updates live.
  useEffect(() => {
    if (!meeting || meeting.transcriptStatus === "done") return;
    let active = true;
    const interval = setInterval(async () => {
      const t = await fetchTranscript(meeting.id);
      if (active && t && (t.summary || t.text)) {
        setTranscript(t);
        setMeeting((prev) => (prev && prev.id === meeting.id ? { ...prev, transcriptStatus: "done" } : prev));
        setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, transcriptStatus: "done" } : m)));
      }
    }, 4000);
    const stop = setTimeout(() => clearInterval(interval), 120000);
    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [meeting?.id, meeting?.transcriptStatus, fetchTranscript]);

  const selectMeeting = async (m: MeetingData) => {
    setMeeting(m);
    setTranscript(null);
    setTranscript(await fetchTranscript(m.id));
  };

  const processing =
    meeting != null &&
    meeting.transcriptStatus !== "done" &&
    !transcript?.summary &&
    !transcript?.text;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {showRecorder && (
        <MeetingRecorderPanel
          projectId={projectId}
          onClose={() => setShowRecorder(false)}
          onComplete={() => setReloadKey((k) => k + 1)}
        />
      )}

      {/* ── HEADER (page-level actions — separate from the meeting shown below) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meetings</h1>
          <p className="text-sm text-muted-foreground">Record, transcribe, and ask questions about your meetings.</p>
        </div>
        <Button onClick={() => setShowRecorder(true)} size="lg">
          <Mic className="h-4 w-4" /> Record a new meeting
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Mic className="h-6 w-6 text-muted-foreground" />
            </span>
            <div>
              <p className="font-medium text-foreground">No meetings yet</p>
              <p className="text-sm text-muted-foreground">Record your first meeting to see transcripts and AI insights.</p>
            </div>
            <Button onClick={() => setShowRecorder(true)}>
              <Mic className="h-4 w-4" /> Record a new meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── HISTORY LIST ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
              <span className="text-xs text-muted-foreground">{meetings.length}</span>
            </div>
            {meetings.map((m) => {
              const selected = m.id === meeting?.id;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMeeting(m)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected ? "border-primary bg-accent" : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1 text-sm font-medium text-foreground">{m.title}</span>
                    <Badge variant={statusVariant(m.status)} className="shrink-0 capitalize">
                      {m.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(m.startsAt)}
                    <span>·</span>
                    <span className="capitalize">{m.type.replace("_", " ")}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── DETAIL ── */}
          {meeting && (
            <div className="space-y-6">
              {/* Meeting header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatDateTime(meeting.startsAt)}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{meeting.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{meeting.type.replace("_", " ")}</span>
                    <Badge variant={statusVariant(meeting.status)} className="capitalize">
                      {meeting.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/project/${projectId}/change-orders`}>Draft change order</Link>
                </Button>
              </div>

              {/* Audio player */}
              {meeting.recordingUrl && <MeetingAudioPlayer url={meeting.recordingUrl} />}

              {processing && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcript is being processed — this updates automatically.
                </div>
              )}

              {/* Transcript + AI summary */}
              <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transcript?.segments && transcript.segments.length > 0 ? (
                      <div className="space-y-4">
                        {transcript.segments.map((seg, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold text-foreground">{seg.speaker}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {String(Math.floor(seg.start / 60)).padStart(2, "0")}:{String(seg.start % 60).padStart(2, "0")}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">{seg.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : transcript?.text ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{transcript.text}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {processing ? "Processing…" : "No transcript available."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">AI summary</CardTitle>
                    <Badge variant="outline">AI</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!transcript?.summary && (!transcript?.actionItems || transcript.actionItems.length === 0) ? (
                      <p className="text-sm text-muted-foreground">
                        Summary &amp; action items appear here once processing finishes.
                      </p>
                    ) : (
                      <>
                        {transcript?.summary && (
                          <p className="text-sm leading-relaxed text-muted-foreground">{transcript.summary}</p>
                        )}
                        {transcript?.actionItems && transcript.actionItems.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Action items
                            </div>
                            {transcript.actionItems.map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span className="text-sm text-foreground">{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ask box */}
              <MeetingAsk projectId={projectId} meetingId={meeting.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
