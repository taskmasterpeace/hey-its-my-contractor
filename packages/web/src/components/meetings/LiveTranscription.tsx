import { useRef, useEffect } from "react";
import { getStatusConfig } from "@/utils/meeting";
import {
  TranscriptionStatusIndicatorProps,
  TranscriptionStatusType,
} from "@/components/meetings/types";
import { Copy } from "lucide-react";
import LiveTranscriptionContent from "@/components/meetings/LiveTranscriptContent";

const TranscriptionStatusIndicator = ({
  status,
}: TranscriptionStatusIndicatorProps) => {
  const config = getStatusConfig(status);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.color} text-xs font-medium`}
    >
      <span className={config.pulse ? "animate-pulse" : ""}>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

const LiveTranscription = ({
  transcripts,
  status,
  isPaused = false,
}: {
  transcripts: Record<string, string>;
  status: TranscriptionStatusType;
  isPaused?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTranscriptsEmpty = Object.keys(transcripts)?.length === 0;

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (containerRef.current && !isTranscriptsEmpty) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts, isTranscriptsEmpty]);

  return (
    <div className="w-full rounded-lg p-4 border no-drag h-full flex flex-col transition-all duration-300 ease-in-out bg-white text-black mb-4 max-h-[440px] overflow-y-auto backdrop-filter-none">
      <div className="flex items-center justify-between mb-3 w-full">
        <h3 className="font-semibold">Live Transcription</h3>
        <div className="flex items-center gap-2">
          <TranscriptionStatusIndicator status={status} />
          <button
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            onClick={() => {
              const text = Object.values(transcripts).join("\n");
              navigator.clipboard.writeText(text);
            }}
            title="Copy all transcripts"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="bg-white/70 rounded-lg text-base text-gray-600 overflow-y-auto flex-1 p-3 min-h-[350px]"
      >
        <LiveTranscriptionContent
          transcripts={transcripts}
          status={status}
          isPaused={isPaused}
        />
      </div>
    </div>
  );
};

export default LiveTranscription;
