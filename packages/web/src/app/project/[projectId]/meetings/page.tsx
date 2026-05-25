"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Check } from "lucide-react";

interface TranscriptSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
  confidence: number;
}

interface MeetingData {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  type: string;
  status: string;
}

interface TranscriptData {
  text: string | null;
  segments: TranscriptSegment[];
  summary: string | null;
  actionItems: string[];
}

const AVATAR_COLORS: Record<string, string> = {
  "Andrea Johnson": "#7A4E2A",
  "Sam": "#2D5A6A",
  "Rob": "#4F6E2A",
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProjectMeetingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/project/${projectId}/meetings`);
        if (!res.ok) return;
        const json = await res.json();
        const raw = json.data || json.meetings || [];
        const mtgs: MeetingData[] = raw.map((m: any) => ({
          id: m.id,
          title: m.title,
          startsAt: m.starts_at || m.startsAt,
          endsAt: m.ends_at || m.endsAt || null,
          type: m.type,
          status: m.status,
        }));
        setMeetings(mtgs);

        const completed = mtgs.filter(m => m.status === "completed");
        if (completed.length > 0) {
          const latest = completed[0];
          setMeeting(latest);

          const tRes = await fetch(`/api/project/${projectId}/meetings/${latest.id}/transcript`);
          if (tRes.ok) {
            const tData = await tRes.json();
            setTranscript(tData.transcript || null);
          }
        }
      } catch (e) {
        console.error("Failed to load meetings:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const segments = transcript?.segments || [];
  const actionItems = transcript?.actionItems || [];
  const summary = transcript?.summary || "";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (loading) {
    return (
      <div style={{ padding: "44px 48px 56px" }} className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: "var(--ft-hi-vis)" }} />
          <p className="text-sm" style={{ color: "var(--ft-steel)" }}>Loading meetings…</p>
        </div>
      </div>
    );
  }

  if (!meeting || !transcript) {
    return (
      <div style={{ padding: "44px 48px 56px", maxWidth: 1400 }}>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--ft-steel)" }}>
          Meetings
        </div>
        <h1 className="font-display mt-1.5" style={{ fontWeight: 800, fontSize: 36, color: "var(--ft-ink)" }}>
          No meetings with transcripts yet
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--ft-steel)" }}>
          Record a meeting from the calendar to see transcripts and AI insights here.
        </p>
      </div>
    );
  }

  const titleWords = meeting.title.split(" ");

  return (
    <div style={{ padding: "44px 48px 56px", display: "flex", flexDirection: "column", gap: 32, maxWidth: 1400 }}>
      {/* ── HEADER ── */}
      <div className="flex justify-between items-end gap-4">
        <div>
          <div
            className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--ft-steel)" }}
          >
            Meeting · {formatDate(meeting.startsAt)}
          </div>
          <h1
            className="font-display"
            style={{ fontWeight: 800, fontSize: 48, letterSpacing: "-0.025em", margin: "14px 0 12px", lineHeight: 1.06, color: "var(--ft-ink)" }}
          >
            {titleWords.map((w, i) => (
              <span key={i} style={{ fontStyle: i === 1 ? "italic" : "normal", color: i === 1 ? "var(--ft-steel)" : "var(--ft-ink)" }}>
                {w}{" "}
              </span>
            ))}
          </h1>
          <div className="flex items-center gap-3.5" style={{ color: "var(--ft-steel)", fontSize: 14 }}>
            <span>{meeting.type.replace("_", " ")}</span>
            <span style={{ width: 1, height: 12, background: "var(--ft-rule-2)", display: "inline-block" }} />
            <div className="flex">
              {Array.from(new Set(segments.map(s => s.speaker))).map((speaker, i) => (
                <div
                  key={speaker}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{
                    background: AVATAR_COLORS[speaker] || "#6B6D63",
                    color: "#fff",
                    marginLeft: i === 0 ? 0 : -6,
                    border: "2px solid var(--ft-paper)",
                    zIndex: 10 - i,
                    position: "relative",
                  }}
                >
                  {getInitials(speaker)}
                </div>
              ))}
            </div>
            <span>{new Set(segments.map(s => s.speaker)).size} speakers</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            className="px-3.5 py-2 text-[13px] font-medium rounded"
            style={{ border: "1px solid var(--ft-rule)", color: "var(--ft-ink)", background: "var(--ft-paper)" }}
          >
            Share clip
          </button>
          <Link
            href={`/project/${projectId}/change-orders`}
            className="px-3.5 py-2 text-[13px] font-medium rounded"
            style={{ background: "var(--ft-hi-vis)", color: "#fff", textDecoration: "none" }}
          >
            Draft change order →
          </Link>
        </div>
      </div>

      {/* ── WAVEFORM PLAYER ── */}
      <div className="rounded overflow-hidden" style={{ border: "1px solid var(--ft-rule)" }}>
        <div className="flex items-stretch">
          <button
            onClick={() => setPlaying(!playing)}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 68, background: "var(--ft-ink)", color: "var(--ft-paper)", border: "none", cursor: "pointer" }}
          >
            {playing ? (
              <Pause className="w-[18px] h-[18px]" fill="currentColor" />
            ) : (
              <Play className="w-[18px] h-[18px]" fill="currentColor" />
            )}
          </button>
          <div className="flex-1 px-[18px] py-3 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="font-mono text-[11px]" style={{ color: "var(--ft-steel)" }}>
                00:{String(22 + Math.floor(selectedIdx * 1.5)).padStart(2, "0")}:38
              </span>
              <span className="font-mono text-[11px]" style={{ color: "var(--ft-steel)" }}>
                1.0× · {new Set(segments.map(s => s.speaker)).size} speakers detected
              </span>
            </div>
            <svg viewBox="0 0 800 36" style={{ width: "100%", height: 36 }}>
              {Array.from({ length: 120 }).map((_, i) => {
                const h = 4 + Math.abs(Math.sin(i * 0.6) * Math.cos(i * 0.3)) * 24 + (i % 3) * 2;
                const x = i * 7;
                const past = i < (selectedIdx + 1) * 14;
                return <rect key={i} x={x} y={(36 - h) / 2} width="4" height={h} fill={past ? "var(--ft-ink)" : "var(--ft-rule-2)"} />;
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMNS: Transcript + AI panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Transcript */}
        <div className="rounded" style={{ background: "var(--ft-paper)", border: "1px solid var(--ft-rule)" }}>
          <div className="flex justify-between items-baseline px-5 py-3.5" style={{ borderBottom: "1px solid var(--ft-rule)" }}>
            <h2 className="font-display text-[15px] font-semibold" style={{ color: "var(--ft-ink)" }}>Transcript</h2>
            <span className="text-[12px]" style={{ color: "var(--ft-steel)" }}>tap a line to play · 99% confidence</span>
          </div>
          <div className="flex flex-col">
            {segments.map((seg, i) => {
              const sel = i === selectedIdx;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className="flex items-start gap-3 text-left transition-colors"
                  style={{
                    padding: "10px 16px",
                    background: sel ? "var(--ft-paper-2)" : "transparent",
                    borderLeft: sel ? "3px solid var(--ft-hi-vis)" : "3px solid transparent",
                    border: "none",
                    borderBottom: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: AVATAR_COLORS[seg.speaker] || "#6B6D63", color: "#fff" }}
                  >
                    {getInitials(seg.speaker)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--ft-ink)" }}>{seg.speaker.split(" ")[0]}</span>
                      <span className="font-mono text-[10px]" style={{ color: "var(--ft-steel)" }}>
                        {String(Math.floor(seg.start / 60)).padStart(2, "0")}:{String(seg.start % 60).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="text-[14px] mt-0.5" style={{ color: "var(--ft-ink-soft)", lineHeight: 1.55 }}>
                      {seg.text}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* What FieldTime heard */}
        <div className="rounded" style={{ background: "var(--ft-paper)", border: "1px solid var(--ft-rule)" }}>
          <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: "1px solid var(--ft-rule)" }}>
            <h2 className="font-display text-[15px] font-semibold" style={{ color: "var(--ft-ink)" }}>What FieldTime heard</h2>
            <span
              className="px-2 py-0.5 text-[10px] font-medium rounded uppercase tracking-wide"
              style={{ background: "var(--ft-paper-2)", color: "var(--ft-steel)" }}
            >
              AI · cited
            </span>
          </div>
          <div className="px-5 py-4">
            {summary && (
              <p className="text-[12px] mb-4" style={{ color: "var(--ft-steel)", lineHeight: 1.5 }}>
                {summary}
              </p>
            )}

            {/* Action items as decisions */}
            {actionItems.map((item, i) => (
              <div
                key={i}
                className="flex gap-3 items-start"
                style={{
                  padding: "12px 0",
                  borderTop: i === 0 ? "1px solid var(--ft-rule)" : "1px dashed var(--ft-rule)",
                }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "var(--ft-hi-vis)", color: "#fff" }}
                >
                  <Check className="w-[11px] h-[11px]" strokeWidth={3} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ft-ink)" }}>{item}</div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: "var(--ft-steel)" }}>
                    follow-up · from transcript
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OTHER MEETINGS LIST ── */}
      {meetings.length > 1 && (
        <div>
          <div className="flex justify-between items-baseline pb-3.5 mb-1" style={{ borderBottom: "1px solid var(--ft-rule)" }}>
            <h2 className="font-display text-[22px]" style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ft-ink)" }}>
              All meetings
            </h2>
            <span className="font-mono text-[12px]" style={{ color: "var(--ft-steel)" }}>{meetings.length}</span>
          </div>
          {meetings.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-5 py-3.5 transition-colors hover:bg-[var(--ft-hi-vis-soft)] -mx-3 px-3 rounded cursor-pointer"
              style={{
                borderBottom: i < meetings.length - 1 ? "1px solid var(--ft-rule)" : "none",
              }}
              onClick={() => {
                setMeeting(m);
                fetch(`/api/project/${projectId}/meetings/${m.id}/transcript`)
                  .then(r => r.ok ? r.json() : null)
                  .then(d => setTranscript(d?.transcript || null));
              }}
            >
              <div className="font-mono text-[12px] w-24 flex-shrink-0" style={{ color: "var(--ft-steel)" }}>
                {new Date(m.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-medium" style={{ color: m.id === meeting.id ? "var(--ft-hi-vis)" : "var(--ft-ink)" }}>
                  {m.title}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--ft-steel)" }}>
                  {m.type.replace("_", " ")} · {m.status}
                </div>
              </div>
              {m.id === meeting.id && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: "var(--ft-hi-vis-soft)", color: "var(--ft-hi-vis)" }}>
                  viewing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
