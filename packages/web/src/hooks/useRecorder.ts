"use client"

import { MEETING_STATUS, TRANSCRIPTION_STATUS } from "@/constants";
import { TranscriptionStatusType } from "@/components/meetings/types";
import { useEffect, useRef, useState } from "react";
import { groupWordsBy5sWindow } from "@/utils/meeting";
import MeetingService from "@/services/meeting";
import { getUserId } from "@/app/actions";
import meetingRecordingService from "@/lib/services/meeting-recording-service";

// Extend the Window interface to include our custom property
declare global {
    interface Window {
        recordingTimer?: NodeJS.Timeout;
    }
}

const useRecorder = ({
    meetingTitle,
    setShowMeetingTitleError,
    selectedTags
}: {
    meetingTitle: string,
    setShowMeetingTitleError: (error: boolean) => void,
    selectedTags: string[]
}) => {
    const socket = useRef<WebSocket | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    const [status, setStatus] = useState<TranscriptionStatusType>(TRANSCRIPTION_STATUS.IDLE)
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [transcripts, setTranscripts] = useState<Record<string, string>>({});
    const timeStampRef = useRef<number>(0)
    const [recordingDuration, setRecordingDuration] = useState(0);
    const pausedTimeRef = useRef<number>(0);
    const tokenExpiresAtRef = useRef<number>(0);
    const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Refs for transcript management
    const transcriptBufferRef = useRef<Record<string, string>>({});
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastProcessedTextRef = useRef<string>("");

    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false); // Use ref for audio callback
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false); // Use ref for audio callback
    const isRecordingRef = useRef(false); // Use ref for token refresh callback

    // Store current project ID for upload
    const currentProjectIdRef = useRef<string>("");

    // sync timestamp with recording duration
    useEffect(() => {
        timeStampRef.current = recordingDuration
    }, [recordingDuration])

    // update meeting transcript every 30 seconds (WITHOUT changing status)
    useEffect(() => {
        const interval = setInterval(() => {
            if (socket.current && socket.current.readyState === WebSocket.OPEN && isRecording) {
                const meetingId = localStorage.getItem("meetingId");
                const transcriptText = Object.values(transcriptBufferRef.current).join(" ") || ""
                if (meetingId && transcriptText) {
                    // Only update the transcript field, don't touch the status
                    // Status will be set to COMPLETED only when stopRecording() is called
                    fetch("/api/meetings/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            meetingId,
                            transcriptText,
                        })
                    }).catch(err => console.error("Failed to update transcript:", err));
                }
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [isRecording])

    // prevent user from leaving unsaved changes
    useEffect(() => {
        // single-run guard to avoid duplicates across overlapping events
        let hasFlushed = false;
        const suppressBeforeUnloadRef = { current: false };
        const guardPushedRef = { current: false };
        const GUARD_KEY = '__leave_guard__';

        const flushOnce = () => {
            if (hasFlushed) return;
            hasFlushed = true;

            const transcription = Object.values(transcriptBufferRef.current ?? {})
                .join(' ')
                .trim();
            const meetingId = localStorage.getItem('meetingId');
            if (!isRecording || !meetingId) return;

            const payload = {
                meetingId,
                transcriptText: transcription || '',
                status: MEETING_STATUS.COMPLETED,
            };

            try {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                const ok = navigator.sendBeacon('/api/meetings/update', blob);
                if (!ok) throw new Error('sendBeacon rejected');
            } catch {
                try {
                    fetch('/api/meetings/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        keepalive: true,
                    }).catch(() => { });
                } catch { }
            }

            try {
                localStorage.removeItem('meetingId');
            } catch { }
        };

        // Stable handlers so we can remove them
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isRecording || suppressBeforeUnloadRef.current) return;
            e.preventDefault();
            e.returnValue = '';
            flushOnce();
        };

        const handlePageHide = () => {
            if (!isRecording) return;
            flushOnce();
        };

        const handleVisibility = () => {
            if (!isRecording) return;
            if (document.visibilityState === 'hidden') {
                flushOnce();
            }
        };

        // Attach listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('visibilitychange', handleVisibility);

        // Push ONE guard entry only if not already present
        if (isRecording) {
            const state = history.state || {};
            const alreadyGuarded = state[GUARD_KEY] === true;
            if (!alreadyGuarded && !guardPushedRef.current) {
                // Preserve existing state, tag guard, and push once
                const newState = { ...state, [GUARD_KEY]: true };
                history.pushState(newState, '', location.href);
                guardPushedRef.current = true;
            }
        }

        // Back navigation trap
        const onPopState = () => {
            if (!isRecording) return;

            const ok = window.confirm('Leave this page? Unsaved changes may be lost.');
            if (!ok) {
                // Re-insert our guard so further back presses still come here
                const state = { ...(history.state || {}), [GUARD_KEY]: true };
                history.pushState(state, '', location.href);
                return;
            }

            flushOnce();

            // Suppress the unload prompt for our programmatic back navigation
            suppressBeforeUnloadRef.current = true;
            window.removeEventListener('beforeunload', handleBeforeUnload);

            history.back();
        };

        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [isRecording]);

    // Toggle mute function
    const toggleMute = (muted: boolean) => {
        setIsMuted(muted);
        isMutedRef.current = muted;
    };

    // Toggle pause function
    const togglePause = () => {
        if (!isRecording) return;

        const newPausedState = !isPaused;
        setIsPaused(newPausedState);
        isPausedRef.current = newPausedState;

        if (newPausedState) {
            // Pausing: store current time and stop timer
            pausedTimeRef.current = recordingDuration;

            // Stop the recording timer
            if (window.recordingTimer) {
                clearInterval(window.recordingTimer);
                delete window.recordingTimer;
            }
        } else {
            // Resuming: restart timer from paused time
            const startTime = Date.now() - (pausedTimeRef.current * 1000);
            const timer = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

            window.recordingTimer = timer;
            setStatus(TRANSCRIPTION_STATUS.LISTENING);
        }
    };

    // Flush transcript updates to state
    const flushTranscriptUpdates = () => {
        if (Object.keys(transcriptBufferRef.current).length > 0) {
            setTranscripts({ ...transcriptBufferRef.current });
        }
    };

    // Extract only new text from cumulative transcript
    const getNewText = (currentText: string, previousText: string): string => {
        const current = currentText.trim();
        const previous = previousText.trim();

        // If no previous text, return current
        if (!previous) return current;

        // If current starts with previous, extract the new part
        if (current.startsWith(previous)) {
            const newPart = current.slice(previous.length).trim();
            return newPart;
        }

        // If they're completely different, return current
        // (this handles speaker changes or restarts)
        return current;
    };


    // Add new transcript only if there's new content
    const addTranscript = (text: string) => {
        const trimmedText = text.trim();

        // Skip if empty
        if (!trimmedText) {
            return;
        }

        // Extract only the new portion compared to last processed text
        const newText = getNewText(trimmedText, lastProcessedTextRef.current);
        // Skip if no new text
        if (!newText) {
            // console.log(`⏭️ Skipped (no new text)`);
            return;
        }

        // Update last processed text to full current text
        lastProcessedTextRef.current = trimmedText;

        //use time with date unique identifier for uniqueness
        const timestamp = Date.now();
        const time = timeStampRef.current + "_" + timestamp;

        // Add only the NEW text to buffer
        transcriptBufferRef.current[time] = newText;

        // Immediately flush to UI
        flushTranscriptUpdates();

        // console.log(`✅ Added transcript #${time}:`, newText);
    };

    // Reset all states
    const resetRecording = () => {
        setTranscripts({});
        transcriptBufferRef.current = {};
        lastProcessedTextRef.current = "";
        setRecordingDuration(0);
        setIsMuted(false);
        setIsPaused(false);
        isMutedRef.current = false;
        isPausedRef.current = false;
        pausedTimeRef.current = 0;
        timeStampRef.current = 0;

        // Clear any pending update timers
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
        }

        // Clear token refresh timer
        if (tokenRefreshTimerRef.current) {
            clearTimeout(tokenRefreshTimerRef.current);
            tokenRefreshTimerRef.current = null;
        }
    };

    const refreshWebSocketConnection = async () => {
        const refreshStartTime = Date.now();
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`[Token Refresh] Starting token refresh at ${new Date().toISOString()}`);
        console.log(`[Token Refresh] Previous token was set to expire at: ${new Date(tokenExpiresAtRef.current).toISOString()}`);

        try {
            // Get a new token
            const tokenData = await MeetingService.getToken();

            if (!tokenData) {
                console.error("[Token Refresh] Failed to get token data from API");
                return;
            }

            const { token, expiresAt } = tokenData;
            const tokenFetchTime = Date.now() - refreshStartTime;
            console.log(`[Token Refresh] New token received in ${tokenFetchTime}ms`);
            console.log(`[Token Refresh] New token expires at: ${new Date(expiresAt).toISOString()}`);

            tokenExpiresAtRef.current = expiresAt;

            // Close old WebSocket connection
            if (socket.current) {
                console.log("[Token Refresh] Closing old WebSocket connection...");

                // Remove old event listeners to prevent
                socket.current.onclose = null;
                socket.current.onerror = null;
                socket.current.onmessage = null;

                // Send terminate message and close
                try {
                    socket.current.send(JSON.stringify({ type: "Terminate" }));
                    console.log("[Token Refresh] Terminate message sent to old connection");
                } catch (e) {
                    console.log("[Token Refresh] Could not send terminate message:", e);
                }
                socket.current.close();
                console.log("[Token Refresh] Old WebSocket connection closed");
            }

            // Create new WebSocket with fresh token
            console.log("[Token Refresh] Creating new WebSocket connection...");
            const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&token=${token}`;
            socket.current = new WebSocket(wsUrl);
            setupWebSocketHandlers();

            // Schedule next token refresh (8 minutes from now, 2 minutes before expiry)
            scheduleTokenRefresh();

            const totalRefreshTime = Date.now() - refreshStartTime;
            console.log(`[Token Refresh] Token refresh completed successfully in ${totalRefreshTime}ms`);
        } catch (error) {
            console.error("[Token Refresh] Error refreshing token:", error);
            console.error("[Token Refresh] Error details:", {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            setStatus(TRANSCRIPTION_STATUS.ERROR);
        }
    };

    const scheduleTokenRefresh = () => {
        if (tokenRefreshTimerRef.current) {
            clearTimeout(tokenRefreshTimerRef.current);
        }
        const refreshIn = 8 * 60 * 1000; // 480 seconds (8 minutes)
        const scheduledTime = new Date(Date.now() + refreshIn);

        tokenRefreshTimerRef.current = setTimeout(() => {
            console.log(`[Token Refresh] Timer triggered at ${new Date().toISOString()}`);
            if (isRecordingRef.current && !isPausedRef.current) {
                console.log("[Token Refresh] Recording is active, proceeding with refresh");
                refreshWebSocketConnection();
            } else {
                console.log("[Token Refresh] Skipping refresh - recording stopped or paused");
                console.log(`isRecording: ${isRecordingRef.current}, isPaused: ${isPausedRef.current}`);
            }
        }, refreshIn);

        const minutes = Math.floor(refreshIn / 1000 / 60);
        const seconds = Math.floor((refreshIn / 1000) % 60);
        console.log(`[Token Refresh] Next refresh scheduled in ${minutes}m ${seconds}s at ${scheduledTime.toISOString()}`);
    };

    // Setup WebSocket event handlers (extracted for reuse)
    const setupWebSocketHandlers = (isInitialConnection: boolean = false) => {
        if (!socket.current) return;

        socket.current.onopen = async () => {
            if (isInitialConnection) {
                setStatus(TRANSCRIPTION_STATUS.LISTENING)
                const startTime = Date.now();
                const timer = setInterval(() => {
                    setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
                }, 1000);

                (window).recordingTimer = timer;
                setIsRecording(true);
                isRecordingRef.current = true; // Sync ref with state

                mediaStream.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100,
                    }
                });

                // Start audio recording for file storage
                try {
                    await meetingRecordingService.startAudioRecording(mediaStream.current);
                    console.log("🎙️ Audio recording service started");
                } catch (error) {
                    console.error("Failed to start audio recording service:", error);
                }

                audioContext.current = new AudioContext({ sampleRate: 16000 });

                const source = audioContext.current.createMediaStreamSource(
                    mediaStream.current
                );

                try {
                    // Try to use ScriptProcessorNode (deprecated but widely supported)
                    scriptProcessor.current = audioContext.current.createScriptProcessor(
                        4096,
                        1,
                        1
                    );

                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(audioContext.current.destination);

                    // Check muted/paused state and send silence when muted or paused
                    scriptProcessor.current.onaudioprocess = (event) => {
                        if (!socket.current || socket.current.readyState !== WebSocket.OPEN)
                            return;

                        const input = event.inputBuffer.getChannelData(0);
                        const buffer = new Int16Array(input.length);

                        if (isMutedRef.current || isPausedRef.current) {
                            // Muted or Paused: send silence (zeros) to keep session alive
                            // Buffer is already initialized with zeros, no loop needed
                        } else {
                            // Not muted/paused: send actual audio
                            for (let i = 0; i < input.length; i++) {
                                buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
                            }
                        }

                        socket.current.send(buffer.buffer);
                    };
                } catch (error) {
                    console.error("Failed to create audio processor:", error);
                    setStatus(TRANSCRIPTION_STATUS.ERROR);
                    alert("Audio processing not supported in this browser. Please try Chrome or Edge.");
                    stopRecording();
                    return;
                }
            } else {
                console.log("WebSocket reconnected with new token");
                setStatus(TRANSCRIPTION_STATUS.LISTENING);
            }
        };

        socket.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                // Only update status to LISTENING if not paused
                if (!isPausedRef.current) {
                    setStatus(TRANSCRIPTION_STATUS.LISTENING);
                }

                // Handle SessionBegins
                if (message.type === "SessionBegins") {
                    console.log("Transcription session started");
                    return;
                }

                // Handle PartialTranscript - ignore to prevent duplicates
                if (message.type === "PartialTranscript") {
                    return;
                }

                // Handle FinalTranscript - ignore, wait for Turn
                if (message.type === "FinalTranscript") {
                    return;
                }

                // Handle Turn - complete speaker turn (ONLY SOURCE OF TRUTH)
                if (message.type === "Turn" && !isPausedRef.current) {
                    const { transcript } = message;
                    if (transcript && transcript.trim()) {
                        addTranscript(transcript);
                    }
                    return;
                }

                // Handle errors
                if (message.type === "SessionError") {
                    console.error("Transcription error:", message);
                    setStatus(TRANSCRIPTION_STATUS.ERROR);
                }
            } catch (error) {
                console.error("Error processing message:", error);
            }
        };

        socket.current.onerror = async (err) => {
            console.error("WebSocket error:", err);
            const meetingId = localStorage.getItem("meetingId");
            const transcriptText = Object.values(transcriptBufferRef.current).join(" ") || "";
            if (meetingId) {
                await MeetingService.updateMeeting({
                    meetingId,
                    transcriptText,
                    status: MEETING_STATUS.CANCELLED
                })

                localStorage.removeItem("meetingId");
            }
            setStatus(TRANSCRIPTION_STATUS.ERROR)
            stopRecording();
        };

        socket.current.onclose = () => {
            console.log("WebSocket closed")
            if (!isRecording) {
                setStatus(TRANSCRIPTION_STATUS.IDLE)
            }
            socket.current = null;
        };
    };

    const startRecording = async (projectId: string, meetingType: string) => {
        try {
            if (!meetingTitle || meetingTitle.length === 0) {
                setShowMeetingTitleError(true);
                return;
            } else {
                setShowMeetingTitleError(false);
            }
            setRecordingDuration(0);
            setStatus(TRANSCRIPTION_STATUS.CONNECTING)

            // Store project ID for later use
            currentProjectIdRef.current = projectId;
            const tokenData = await MeetingService.getToken();
            if (!tokenData) {
                setStatus(TRANSCRIPTION_STATUS.ERROR)
                alert("Failed to get token");
                return null;
            }

            const { token, expiresAt } = tokenData;
            tokenExpiresAtRef.current = expiresAt;


            const userId = await getUserId();

            if (!userId) {
                setStatus(TRANSCRIPTION_STATUS.ERROR)
                alert("Failed to get user");
                return null;
            }

            const { data, success, message } = await MeetingService.startMeeting({
                userId,
                projectId,
                title: meetingTitle,
                meetingType,
                tags: selectedTags,
            });
            const meetingId = data?.meeting?.id;
            if (!success || !meetingId) {
                setStatus(TRANSCRIPTION_STATUS.ERROR)
                alert(message || "Failed to create meeting");
                return;
            }
            localStorage.setItem("meetingId", meetingId);
            const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&token=${token}`;
            socket.current = new WebSocket(wsUrl);
            setupWebSocketHandlers(true);

            // Schedule token refresh before it expires
            scheduleTokenRefresh();
        } catch (error) {
            console.error("error occurred", error)
            setStatus(TRANSCRIPTION_STATUS.ERROR)
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        isRecordingRef.current = false; // Sync ref with state
        setIsUploading(true); // Set uploading state
        setStatus(TRANSCRIPTION_STATUS.IDLE);

        // Stop timer immediately for instant visual feedback
        if (window.recordingTimer) {
            clearInterval(window.recordingTimer);
            delete window.recordingTimer;
        }

        // Flush any pending updates before saving
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            flushTranscriptUpdates();
        }

        const meetingId = localStorage.getItem("meetingId");
        const projectId = currentProjectIdRef.current;
        const transcriptText = Object.values(transcriptBufferRef.current).join(" ") || "";

        // Stop audio recording and get the blob
        let recordingUrl = "";
        try {
            console.log("🛑 Stopping audio recording service...");
            const audioBlob = await meetingRecordingService.stopAudioRecording();

            if (audioBlob && audioBlob.size > 0 && meetingId && projectId) {
                console.log("📤 Uploading recording to Supabase...");
                recordingUrl = await meetingRecordingService.uploadRecording(
                    meetingId,
                    projectId,
                    audioBlob
                );
                console.log("✅ Recording uploaded:", recordingUrl);
            } else {
                console.warn("⚠️ No audio data to upload or missing IDs");
            }
        } catch (error) {
            console.error("❌ Failed to upload recording:", error);
            // Continue even if upload fails
        }

        // Update meeting with transcript and recording URL
        if (meetingId) {
            await MeetingService.updateMeeting({
                meetingId,
                transcriptText,
                recordingUrl,
                status: MEETING_STATUS.COMPLETED
            })
        }
        localStorage.removeItem("meetingId");

        // Small delay to ensure final updates are rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        // Save transcripts before clearing
        const transcriptsToSave = { ...transcriptBufferRef.current };
        console.log("💾 Saving transcripts:", transcriptsToSave);

        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }

        if (audioContext.current) {
            audioContext.current.close();
            audioContext.current = null;
        }

        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach((track) => track.stop());
            mediaStream.current = null;
        }

        if (socket.current) {
            socket.current.send(JSON.stringify({ type: "Terminate" }));
            socket.current.close();
            socket.current = null;
        }

        // Cleanup recording service
        meetingRecordingService.cleanup();

        // Reset all states after stopping
        resetRecording();
        setIsUploading(false);
    };

    const orderedTranscript = groupWordsBy5sWindow(transcripts);

    return {
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
        setStatus,
        transcripts: orderedTranscript,
        resetRecording
    }
}

export default useRecorder
