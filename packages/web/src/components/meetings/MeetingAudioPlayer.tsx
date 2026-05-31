"use client";

import { useEffect, useRef, useState } from "react";
import type WaveSurfer from "wavesurfer.js";
import { Play, Pause } from "lucide-react";

interface MeetingAudioPlayerProps {
  url: string;
}

function fmt(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Waveform audio player (wavesurfer.js) for a meeting recording. */
export function MeetingAudioPlayer({ url }: MeetingAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setReady(false);
    setError(false);
    let destroyed = false;

    (async () => {
      const { default: WaveSurfer } = await import("wavesurfer.js");
      if (destroyed || !containerRef.current) return;

      // Pull colors from the theme so the waveform matches light/dark.
      const root = getComputedStyle(document.documentElement);
      const hsl = (v: string) => `hsl(${root.getPropertyValue(v).trim()})`;

      const ws = WaveSurfer.create({
        container: containerRef.current,
        url,
        height: 44,
        waveColor: hsl("--muted-foreground"),
        progressColor: hsl("--primary"),
        cursorColor: hsl("--primary"),
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
      });
      wsRef.current = ws;

      ws.on("ready", () => {
        setReady(true);
        setDuration(ws.getDuration());
      });
      ws.on("timeupdate", (t) => setCurrent(t));
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => setPlaying(false));
      ws.on("error", () => setError(true));
    })();

    return () => {
      destroyed = true;
      wsRef.current?.destroy();
      wsRef.current = null;
    };
  }, [url]);

  if (error) {
    return (
      <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        Couldn&apos;t load the recording. If the audio file exists, make sure the Supabase{" "}
        <code className="rounded bg-muted px-1">recordings</code> bucket is public.
      </div>
    );
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border bg-card">
      <button
        onClick={() => wsRef.current?.playPause()}
        disabled={!ready}
        className="flex w-14 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-[18px] w-[18px]" fill="currentColor" /> : <Play className="h-[18px] w-[18px]" fill="currentColor" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-2.5">
        <div ref={containerRef} className="w-full" />
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>{ready ? fmt(current) : "loading…"}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export default MeetingAudioPlayer;
