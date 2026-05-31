"use client";

import { useMemo, useState } from "react";
import { Mic, Square, Pause, Play, MicOff, X, Loader2 } from "lucide-react";
import useRecorder from "@/hooks/useRecorder";
import { TRANSCRIPTION_STATUS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MEETING_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "progress_review", label: "Progress review" },
  { value: "change_order", label: "Change order" },
  { value: "walkthrough", label: "Walkthrough" },
  { value: "inspection", label: "Inspection" },
];

interface MeetingRecorderPanelProps {
  projectId: string;
  onClose: () => void;
  /** Called after a recording is stopped and uploaded. */
  onComplete?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Modal that drives the AssemblyAI streaming recorder (useRecorder): captures
 * mic audio, shows a live transcript, and on stop creates/uploads the meeting
 * (which then enqueues worker processing).
 */
export function MeetingRecorderPanel({ projectId, onClose, onComplete }: MeetingRecorderPanelProps) {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState("consultation");
  const [showTitleError, setShowTitleError] = useState(false);

  const {
    status,
    isMuted,
    isPaused,
    isRecording,
    isUploading,
    recordingDuration,
    startRecording,
    stopRecording,
    toggleMute,
    togglePause,
    transcripts,
  } = useRecorder({
    meetingTitle,
    setShowMeetingTitleError: setShowTitleError,
    selectedTags: [],
  });

  const liveText = useMemo(
    () =>
      Object.keys(transcripts)
        .map(Number)
        .sort((a, b) => a - b)
        .map((k) => transcripts[k])
        .join(" "),
    [transcripts]
  );

  const connecting = status === TRANSCRIPTION_STATUS.CONNECTING;
  const busy = isRecording || isUploading;

  const handleStop = async () => {
    await stopRecording();
    onComplete?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-card text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isRecording && !isPaused ? "bg-destructive/10" : "bg-muted"}`}>
              <Mic className={`h-4 w-4 ${isRecording && !isPaused ? "text-destructive" : "text-primary"}`} />
            </span>
            <div>
              <h2 className="text-base font-semibold leading-none">
                {isRecording ? "Recording…" : isUploading ? "Saving…" : "Record meeting"}
              </h2>
              {(isRecording || connecting) && (
                <span className="text-xs text-muted-foreground">
                  {connecting ? "Connecting" : isPaused ? "Paused" : isMuted ? "Muted" : "Listening"} ·{" "}
                  <span className="font-mono">{formatDuration(recordingDuration)}</span>
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {/* Title + type */}
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">Meeting title</Label>
            <Input
              id="meeting-title"
              value={meetingTitle}
              onChange={(e) => {
                setMeetingTitle(e.target.value);
                if (e.target.value) setShowTitleError(false);
              }}
              disabled={busy}
              placeholder="e.g. Kitchen walkthrough with Andrea"
              className={showTitleError ? "border-destructive" : ""}
            />
            {showTitleError && <p className="text-xs text-destructive">A title is required to start recording.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-type">Type</Label>
            <select
              id="meeting-type"
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              disabled={busy}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              {MEETING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live transcript */}
          {(isRecording || liveText) && (
            <div className="space-y-1.5">
              <Label>Live transcript</Label>
              <div className="max-h-56 min-h-[80px] overflow-y-auto rounded-md bg-muted px-3 py-3 text-sm leading-relaxed text-foreground">
                {liveText || <span className="text-muted-foreground">Live transcript will appear here…</span>}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          {!busy ? (
            <Button onClick={() => startRecording(projectId, meetingType)} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              {connecting ? "Connecting…" : "Start recording"}
            </Button>
          ) : isUploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving &amp; uploading…
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => toggleMute(!isMuted)}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="outline" onClick={togglePause}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4" fill="currentColor" /> Stop
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingRecorderPanel;
