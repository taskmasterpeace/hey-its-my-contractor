'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface WaveformPlayerProps {
  audioUrl: string;
  segments?: Array<{
    start: number;
    end: number;
    speaker: string;
    text: string;
  }>;
  currentTime?: number;
  onTimeChange?: (time: number) => void;
  onSegmentClick?: (segmentIndex: number) => void;
  height?: number;
  className?: string;
}

export function WaveformPlayer({
  audioUrl,
  segments = [],
  currentTime = 0,
  onTimeChange,
  onSegmentClick,
  height = 128,
  className = '',
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initWaveSurfer = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamic import to avoid SSR issues
        const WaveSurfer = (await import('wavesurfer.js')).default;

        wavesurferRef.current = WaveSurfer.create({
          container: containerRef.current,
          waveColor: '#e5e7eb',
          progressColor: '#2563eb',
          cursorColor: '#1d4ed8',
          barWidth: 2,
          barRadius: 1,
          responsive: true,
          height: height,
          normalize: true,
          backend: 'WebAudio',
          interact: true,
        });

        // Load audio
        wavesurferRef.current.load(audioUrl);

        // Event listeners
        wavesurferRef.current.on('ready', () => {
          setDuration(wavesurferRef.current.getDuration());
          setIsLoading(false);
        });

        wavesurferRef.current.on('play', () => {
          setIsPlaying(true);
        });

        wavesurferRef.current.on('pause', () => {
          setIsPlaying(false);
        });

        wavesurferRef.current.on('audioprocess', () => {
          const time = wavesurferRef.current.getCurrentTime();
          if (onTimeChange) {
            onTimeChange(time);
          }
        });

        wavesurferRef.current.on('seek', () => {
          const time = wavesurferRef.current.getCurrentTime();
          if (onTimeChange) {
            onTimeChange(time);
          }
        });

        // Add segment markers
        if (segments.length > 0) {
          segments.forEach((segment, index) => {
            wavesurferRef.current.addRegion({
              start: segment.start,
              end: segment.end,
              color: `hsla(${(index * 60) % 360}, 50%, 70%, 0.2)`,
              drag: false,
              resize: false,
              data: {
                segmentIndex: index,
                speaker: segment.speaker,
                text: segment.text,
              },
            });
          });

          // Handle region clicks
          wavesurferRef.current.on('region-click', (region: any) => {
            wavesurferRef.current.setCurrentTime(region.start);
            if (onSegmentClick && region.data) {
              onSegmentClick(region.data.segmentIndex);
            }
          });
        }

      } catch (error) {
        console.error('Failed to initialize WaveSurfer:', error);
        setIsLoading(false);
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl, height]);

  // Update current time when prop changes
  useEffect(() => {
    if (wavesurferRef.current && !isLoading && Math.abs(wavesurferRef.current.getCurrentTime() - currentTime) > 0.5) {
      wavesurferRef.current.setCurrentTime(currentTime);
    }
  }, [currentTime, isLoading]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const skipBack = () => {
    if (wavesurferRef.current) {
      const current = wavesurferRef.current.getCurrentTime();
      wavesurferRef.current.setCurrentTime(Math.max(0, current - 10));
    }
  };

  const skipForward = () => {
    if (wavesurferRef.current) {
      const current = wavesurferRef.current.getCurrentTime();
      const duration = wavesurferRef.current.getDuration();
      wavesurferRef.current.setCurrentTime(Math.min(duration, current + 10));
    }
  };

  const toggleMute = () => {
    if (wavesurferRef.current) {
      if (isMuted) {
        wavesurferRef.current.setVolume(volume);
        setIsMuted(false);
      } else {
        wavesurferRef.current.setVolume(0);
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      {/* Waveform Container */}
      <div className="mb-4">
        {isLoading && (
          <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading audio...</span>
          </div>
        )}
        <div 
          ref={containerRef} 
          className={`w-full ${isLoading ? 'hidden' : ''}`}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={skipBack}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isLoading}
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={skipForward}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isLoading}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Segments List (if provided) */}
      {segments.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Audio Segments ({segments.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {segments.map((segment, index) => (
              <button
                key={index}
                onClick={() => {
                  wavesurferRef.current?.setCurrentTime(segment.start);
                  if (onSegmentClick) {
                    onSegmentClick(index);
                  }
                }}
                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded transition-colors"
              >
                <span className="font-mono text-gray-500">
                  {formatTime(segment.start)}
                </span>
                <span className="ml-2 font-medium text-blue-600">
                  {segment.speaker}:
                </span>
                <span className="ml-1 text-gray-700 truncate">
                  {segment.text.substring(0, 50)}
                  {segment.text.length > 50 ? '...' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}