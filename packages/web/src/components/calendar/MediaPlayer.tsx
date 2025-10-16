'use client'

import React, {
    Fragment,
    useCallback,
    useEffect,
    useRef,
    useState,
    useMemo,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Volume1,
    VolumeX,
    FileText,
    FileAudio,
    X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useAppStore } from '@/store'
import { Meeting } from "@contractor-platform/types"
import { mediaPlayerVariants } from "@/lib/framer-motion"
import TranscriptTextModel from "./TranscriptTextModal"

const formatTimeFromSeconds = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const MediaPlayer: React.FC = () => {
    // app store
    const selectedMeeting = useAppStore((s) => s.selectedMeeting) as Meeting | null
    const setSelectedMeeting = useAppStore((s) => s.setSelectedMeeting)

    // local UI state
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(80)
    const [playbackSpeed, setPlaybackSpeed] = useState<'0.5' | '0.75' | '1' | '1.25' | '1.5' | '2'>('1')
    const [currentTime, setCurrentTime] = useState(0) // seconds
    const [duration, setDuration] = useState<number>(0) // seconds
    const [audioReady, setAudioReady] = useState(false)
    const audioRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null)
    const [isTranscriptOpen, setTranscriptOpen] = useState(false)
    const [selectedTrancriptText, setSelectedTrancriptText] = useState('')
    // normalize fields (support snake_case or camelCase)
    const recordingUrl = selectedMeeting?.recording_url || null
    const startsAt = selectedMeeting?.starts_at || null
    const endsAt = selectedMeeting?.ends_at || null
    const audioUrl = recordingUrl || undefined
    // Calculate duration from timestamps if available
    const calculatedDuration = useMemo(() => {
        if (startsAt && endsAt) {
            const start = new Date(startsAt).getTime()
            const end = new Date(endsAt).getTime()
            const durationMs = end - start
            const durationSeconds = durationMs / 1000
            if (durationSeconds > 0 && isFinite(durationSeconds)) {
                return durationSeconds
            }
        }
        return 0
    }, [startsAt, endsAt])

    // Initialize duration with calculated value
    useEffect(() => {
        if (calculatedDuration > 0) {
            setDuration(calculatedDuration)
        }
    }, [calculatedDuration])

    // Initialize audio or video element (we'll use HTMLAudioElement for audio; if it's a video URL you can use video element)
    useEffect(() => {
        if (!audioUrl) {
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                } catch { }
                audioRef.current = null;
            }
            setAudioReady(false);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            return;
        }

        setAudioReady(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        const audio = new Audio(audioUrl);
        audio.preload = 'metadata';
        if (audioUrl.includes('supabase.co') || audioUrl.startsWith('http')) {
            audio.crossOrigin = 'anonymous';
        }
        audioRef.current = audio;

        // Add error handler
        const onError = (e: ErrorEvent | Event) => {
            console.error('Audio loading error:', e);
            console.error('Audio URL:', audioUrl);
            console.error('Audio error details:', audio.error);
            if (audio.error) {
                switch (audio.error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        break;
                }
            }
            setAudioReady(false);
        };
        audio.addEventListener('error', onError);

        const updateDuration = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
                setAudioReady(true);
            } else if (audio.duration === Infinity) {
                // Use calculated duration as fallback
                if (calculatedDuration > 0) {
                    setDuration(calculatedDuration)
                }
                setAudioReady(true);
            } else {
                // Use calculated duration as fallback
                if (calculatedDuration > 0) {
                    setDuration(calculatedDuration)
                }
                setAudioReady(true);
            }
        };

        const onLoadedMetadata = () => updateDuration()
        const onCanPlay = () => setAudioReady(true)

        const onCanPlayThrough = () => updateDuration()

        const onLoadedData = () => updateDuration()

        const onTimeUpdate = () => {
            if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
                setCurrentTime(audio.currentTime)

                // Keep checking for valid duration during playback
                if (isFinite(audio.duration) && audio.duration > 0) {
                    if (duration === 0 || duration === Infinity || !isFinite(duration)) {
                        setDuration(audio.duration)
                    }
                }
            }
        }

        const onEnded = () => {
            setIsPlaying(false)
            setCurrentTime(duration)
        }

        const onDurationChange = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration)
            }
        }

        audio.addEventListener('loadedmetadata', onLoadedMetadata)
        audio.addEventListener('durationchange', onDurationChange)
        audio.addEventListener('canplay', onCanPlay)
        audio.addEventListener('canplaythrough', onCanPlayThrough)
        audio.addEventListener('loadeddata', onLoadedData)
        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.addEventListener('ended', onEnded)

        audio.volume = isMuted ? 0 : volume / 100
        audio.playbackRate = Number.parseFloat(playbackSpeed)

        return () => {
            audio.pause()
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('durationchange', onDurationChange)
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('canplaythrough', onCanPlayThrough)
            audio.removeEventListener('loadeddata', onLoadedData)
            audio.removeEventListener('timeupdate', onTimeUpdate)
            audio.removeEventListener('ended', onEnded)
            audio.removeEventListener('error', onError)
            audioRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl])

    // Play/pause side-effect
    useEffect(() => {
        const audio = audioRef.current as HTMLAudioElement | null
        if (!audio || !audioReady) return

        if (isPlaying) {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.error('Failed to play audio', err)
                    setIsPlaying(false)
                })
            }
        } else {
            audio.pause()
        }
    }, [isPlaying, audioReady])

    // volume effect
    useEffect(() => {
        const audio = audioRef.current as HTMLAudioElement | null
        if (!audio) return
        audio.volume = isMuted ? 0 : volume / 100
    }, [volume, isMuted])

    // playback speed effect
    useEffect(() => {
        const audio = audioRef.current as HTMLAudioElement | null
        if (!audio) return
        audio.playbackRate = Number.parseFloat(playbackSpeed)
    }, [playbackSpeed])

    // toggle playback
    const togglePlayback = useCallback(() => {
        if (!audioReady || !audioRef.current) return

        // if ended or close to end, reset to 0
        const audio = audioRef.current as HTMLAudioElement
        if (audio.ended || audio.currentTime >= (duration || 0)) {
            audio.currentTime = 0
            setCurrentTime(0)
        }
        setIsPlaying((p) => !p)
    }, [audioReady, duration])

    const skipForward = useCallback(() => {
        const audio = audioRef.current as HTMLAudioElement | null
        if (!audio || !audioReady) return
        try {
            const newTime = Math.min(audio.currentTime + 10, duration || audio.currentTime + 10)
            audio.currentTime = newTime
            setCurrentTime(newTime)
        } catch (err) {
            console.error('skipForward err', err)
        }
    }, [audioReady, duration])

    const skipBackward = useCallback(() => {
        const audio = audioRef.current as HTMLAudioElement | null
        if (!audio || !audioReady) return
        try {
            const newTime = Math.max(audio.currentTime - 10, 0)
            audio.currentTime = newTime
            setCurrentTime(newTime)
        } catch (err) {
            console.error('skipBackward err', err)
        }
    }, [audioReady])

    const handleSeek = useCallback(
        (value: number[]) => {
            const audio = audioRef.current as HTMLAudioElement | null
            if (!audio || !audioReady) return

            const effectiveDuration = duration > 0 ? duration : calculatedDuration
            if (effectiveDuration <= 0) return
            const sliderValue = value[0]
            const newTime = (sliderValue / 100) * effectiveDuration
            const clamped = Math.max(0, Math.min(newTime, effectiveDuration))

            try {
                audio.currentTime = clamped
                setCurrentTime(clamped)
            } catch (err) {
                console.error('seek error', err)
            }
        },
        [audioReady, duration, calculatedDuration],
    )

    const handleVolumeChange = useCallback(
        (value: number[]) => {
            const newVol = value[0]
            setVolume(newVol)
            if (newVol === 0 && !isMuted) setIsMuted(true)
            if (newVol > 0 && isMuted) setIsMuted(false)
        }, [isMuted],
    )

    const toggleMute = useCallback(() => {
        setIsMuted((m) => !m)
    }, [])

    const closePlayer = useCallback(() => {
        setSelectedMeeting(null)
        setIsPlaying(false)
    }, [setSelectedMeeting])

    if (!selectedMeeting) return null

    const title = selectedMeeting.title || 'Untitled meeting'
    return (
        <Fragment>
            <AnimatePresence mode="wait">
                {selectedMeeting && (
                    <motion.div
                        key={selectedMeeting.id}
                        variants={mediaPlayerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="fixed bottom-0 left-0 md:left-64 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
                        style={{ willChange: 'transform' }}
                    >
                        <div className="max-w-full mx-auto p-3 md:p-4">
                            {/* Header row */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-3">
                                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileAudio className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">{title}</h4>
                                        <p className="text-xs md:text-sm text-gray-500">
                                            {startsAt
                                                ? new Date(startsAt).toLocaleString('en-US', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })
                                                : null}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge
                                            variant="outline"
                                            className="gap-1 cursor-pointer text-xs"
                                            onClick={() => {
                                                setSelectedTrancriptText(selectedMeeting?.transcript || '')
                                                setTranscriptOpen(true)
                                            }}
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span className="hidden sm:inline">Transcript</span>
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 absolute top-3 right-3 md:relative md:top-auto md:right-auto">
                                    <button
                                        className="p-1.5 md:p-2 rounded hover:bg-gray-100 transition-colors"
                                        onClick={closePlayer}
                                        title="Close player"
                                    >
                                        <X className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Player controls */}
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                                {/* Playback buttons */}
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={skipBackward}
                                        disabled={!audioReady}
                                    >
                                        <SkipBack className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 rounded-full"
                                        onClick={togglePlayback}
                                        disabled={!audioReady}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-5 w-5" />
                                        ) : (
                                            <Play className="h-5 w-5" />
                                        )}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={skipForward}
                                        disabled={!audioReady}
                                    >
                                        <SkipForward className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Progress slider */}
                                <div className="flex-1 flex items-center gap-2 md:gap-3">
                                    <span className="text-xs md:text-sm text-gray-500 min-w-[40px] md:min-w-[45px]">
                                        {formatTimeFromSeconds(currentTime)}
                                    </span>

                                    <div className="flex-1">
                                        <Slider
                                            value={duration > 0 && isFinite(duration) && currentTime >= 0 ?
                                                [Math.min((currentTime / duration) * 100, 100)] : [0]}
                                            max={100}
                                            step={0.1}
                                            onValueChange={(v) =>
                                                handleSeek(v as number[])
                                            }
                                            onValueCommit={(v) =>
                                                handleSeek(v as number[])
                                            }
                                            disabled={!audioReady || duration <= 0}
                                            className="cursor-pointer"
                                        />
                                    </div>

                                    <span className="text-xs md:text-sm text-gray-500 min-w-[40px] md:min-w-[45px]">
                                        {formatTimeFromSeconds(duration > 0 ? duration : calculatedDuration)}
                                    </span>
                                </div>

                                {/* Volume and speed controls */}
                                <div className="flex items-center justify-between md:justify-start gap-2">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={toggleMute}
                                            disabled={!audioReady}
                                        >
                                            {isMuted ? (
                                                <VolumeX className="h-4 w-4" />
                                            ) : volume < 50 ? (
                                                <Volume1 className="h-4 w-4" />
                                            ) : (
                                                <Volume2 className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <div className="w-20 md:w-36 hidden sm:block">
                                            <Slider
                                                value={[isMuted ? 0 : volume]}
                                                min={0}
                                                max={100}
                                                step={1}
                                                onValueChange={(v) => handleVolumeChange(v as number[])}
                                                className="h-1"
                                            />
                                        </div>
                                    </div>

                                    <Select
                                        value={playbackSpeed}
                                        onValueChange={(v) => setPlaybackSpeed(v as "1" | "2" | "0.5" | "0.75" | "1.25" | "1.5")}
                                        disabled={!audioReady}
                                    >
                                        <SelectTrigger className="w-[60px] md:w-[70px] h-8 text-xs md:text-sm">
                                            <SelectValue placeholder="Speed" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0.5">0.5x</SelectItem>
                                            <SelectItem value="0.75">0.75x</SelectItem>
                                            <SelectItem value="1">1x</SelectItem>
                                            <SelectItem value="1.25">1.25x</SelectItem>
                                            <SelectItem value="1.5">1.5x</SelectItem>
                                            <SelectItem value="2">2x</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Transcript modal */}
            <TranscriptTextModel
                isOpen={isTranscriptOpen}
                setTranscriptOpen={setTranscriptOpen}
                selectedTrancriptText={selectedTrancriptText}
            />
        </Fragment >
    )
}

export default MediaPlayer
