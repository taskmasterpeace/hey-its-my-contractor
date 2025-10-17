import { formatElapsedTime } from "@/utils/dates.helper"
import { TranscriptionStatusType } from "./types"
import { TRANSCRIPTION_STATUS } from "@/constants"
import { Loader2, Mic, MicOff } from "lucide-react"

const LiveTranscriptionContent = ({
    transcripts,
    status,
    isPaused,
}: {
    transcripts: Record<string, string>
    status: TranscriptionStatusType
    isPaused?: boolean
}) => {
    const isTranscriptsEmpty = Object.keys(transcripts)?.length === 0

    // Connecting
    if (status === TRANSCRIPTION_STATUS.CONNECTING) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-yellow-500" />
                <p className="text-sm font-medium">Connecting...</p>
                <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>
        )
    }

    // Paused
    if (isPaused) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="bg-yellow-100 rounded-full p-4 mb-3">
                    <MicOff className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-yellow-600">Recording Paused</p>
                <p className="text-xs text-gray-400 mt-1">
                    Click play to continue transcription
                </p>
            </div>
        )
    }

    // Listening but empty
    if (status === TRANSCRIPTION_STATUS.LISTENING && isTranscriptsEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="bg-green-100 rounded-full p-4 mb-3">
                    <Mic className="w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-green-600">Listening...</p>
                <p className="text-xs text-gray-400 mt-1">Start speaking to see transcription</p>
            </div>
        )
    }

    // Error
    if (status === TRANSCRIPTION_STATUS.ERROR) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="bg-red-100 rounded-full p-4 mb-3">
                    <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-sm font-medium text-red-600">Connection Error</p>
                <p className="text-xs text-gray-400 mt-1">
                    Unable to connect to transcription service
                </p>
                <p className="text-xs text-gray-500 mt-2">Please try again</p>
            </div>
        )
    }

    // Idle
    if (status === TRANSCRIPTION_STATUS.IDLE && isTranscriptsEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="bg-gray-100 rounded-full p-4 mb-3">
                    <Mic className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">Ready to Transcribe</p>
                <p className="text-xs mt-1">Click Start Recording to begin</p>
            </div>
        )
    }

    return (
        <>
            {Object.entries(transcripts).map(([timestamp, text], idx) => (
                <div
                    key={`transcript-${timestamp}-${idx}`}
                    className="flex items-center justify-between space-x-2 mb-2 animate-fadeIn"
                >
                    <p
                        className={`flex-1 rounded p-2 ${idx % 2 === 0 ? 'bg-blue-50 text-blue-900' : 'bg-gray-100 text-gray-900'
                            }`}
                    >
                        {text}
                    </p>
                    <p
                        className={`rounded p-2 font-mono text-xs whitespace-nowrap ${idx % 2 === 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}
                    >
                        {formatElapsedTime(timestamp)}
                    </p>
                </div>
            ))}
        </>
    )
}

export default LiveTranscriptionContent