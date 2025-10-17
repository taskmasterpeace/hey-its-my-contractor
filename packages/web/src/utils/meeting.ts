import { TRANSCRIPTION_STATUS } from "@/constants";
import { TranscriptionStatusType } from "@/components/meetings/types";

export const getStatusConfig = (status: TranscriptionStatusType) => {
    switch (status) {
        case TRANSCRIPTION_STATUS.CONNECTING:
            return {
                color: "text-yellow-500",
                bgColor: "bg-yellow-50 border-yellow-200",
                icon: "⚡",
                text: "Connecting...",
                pulse: true,
            };
        case TRANSCRIPTION_STATUS.LISTENING:
            return {
                color: "text-green-500",
                bgColor: "bg-green-50 border-green-200",
                icon: "🎤",
                text: "Listening...",
                pulse: true,
            };
        case TRANSCRIPTION_STATUS.PROCESSING:
            return {
                color: "text-blue-500",
                bgColor: "bg-blue-50 border-blue-200",
                icon: "⚡",
                text: "Processing...",
                pulse: true,
            };
        case TRANSCRIPTION_STATUS.ERROR:
            return {
                color: "text-red-500",
                bgColor: "bg-red-50 border-red-200",
                icon: "⚠️",
                text: "Connection error",
                pulse: true,
            };
        default:
            return {
                color: "text-gray-400",
                bgColor: "bg-gray-50 border-gray-200",
                icon: "🚀",
                text: "Ready to start",
                pulse: true,
            };
    }
};

type InputMap = Record<string, string>;
type OutputMap = Record<number, string>;

export function groupWordsBy5sWindow(
    input: InputMap,
    windowSeconds = 2
): OutputMap {
    // Parse to [sec, sub, text]
    const items: Array<{ sec: number; sub: number; text: string }> = [];
    for (const [k, v] of Object.entries(input)) {
        const [secStr, subStr = "0"] = k.split("_");
        const sec = Number(secStr);
        const sub = Number(subStr); // often a timestamp; used only for ordering within the same second
        if (Number.isFinite(sec)) {
            items.push({ sec, sub, text: String(v).trim() });
        }
    }

    if (items.length === 0) return {};

    // Sort by second, then by sub-timestamp
    items.sort((a, b) => (a.sec - b.sec) || (a.sub - b.sub));

    // Sweep and build 5-second anchored groups
    const out: OutputMap = {};
    let startSec = items[0].sec;
    let buffer: string[] = [];

    for (const it of items) {
        const inWindow = it.sec <= startSec + windowSeconds;
        if (!inWindow) {
            // flush current group
            if (buffer.length) {
                out[startSec] = buffer.join(" ").replace(/\s+/g, " ").trim();
            }
            // start new window anchored at this item’s second
            startSec = it.sec;
            buffer = [];
        }
        if (it.text) buffer.push(it.text);
    }

    // Flush last group
    if (buffer.length) {
        out[startSec] = buffer.join(" ").replace(/\s+/g, " ").trim();
    }

    return out;
}
