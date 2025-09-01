'use client';

import { useState, useEffect, useRef } from 'react';
import { Transcript, TranscriptSegment, Meeting, UserProfile } from '@contractor-platform/types';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  CheckCircle, 
  Circle, 
  Search,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
  Rewind,
  Maximize,
  Minimize,
  Share,
  Bookmark,
  Clock,
  User,
  MessageSquare,
  Tag as TagIcon,
  Plus,
  X
} from 'lucide-react';

interface EnhancedMeetingTranscriptProps {
  meeting: Meeting;
  transcript: Transcript;
  participants: UserProfile[];
  onUpdateTags?: (tags: string[]) => void;
  onToggleActionItem?: (itemId: string) => void;
  onAddNote?: (timestamp: number, text: string) => void;
  className?: string;
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  isBuffering: boolean;
}

interface MeetingNote {
  id: string;
  timestamp: number;
  text: string;
  created_by: string;
  created_at: string;
}

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source_segment?: number;
}

export function EnhancedMeetingTranscript({
  meeting,
  transcript,
  participants,
  onUpdateTags,
  onToggleActionItem,
  onAddNote,
  className = '',
}: EnhancedMeetingTranscriptProps) {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isMuted: false,
    isBuffering: false,
  });
  
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  // Sample action items (would come from API)
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    {
      id: '1',
      text: 'Schedule electrical inspection by Friday',
      completed: false,
      assignee: 'Mike Johnson',
      dueDate: '2025-01-31',
      priority: 'high',
      source_segment: 3,
    },
    {
      id: '2',
      text: 'Order new cabinets by next week',
      completed: false,
      assignee: 'Mike Johnson',
      dueDate: '2025-02-05',
      priority: 'medium',
      source_segment: 3,
    },
    {
      id: '3',
      text: 'Send cabinet specifications and pricing by Tuesday',
      completed: true,
      assignee: 'Mike Johnson',
      dueDate: '2025-01-28',
      priority: 'medium',
      source_segment: 5,
    },
    {
      id: '4',
      text: 'Review cabinet specifications together',
      completed: false,
      assignee: 'John Smith',
      priority: 'low',
      source_segment: 5,
    },
  ]);

  // Audio control handlers
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setAudioState(prev => ({ ...prev, playbackRate: rate }));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setAudioState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setAudioState(prev => ({ ...prev, volume }));
    }
  };

  // Segment navigation
  const handleSegmentClick = (segmentIndex: number) => {
    const segment = transcript.segments[segmentIndex];
    seekTo(segment.start_time);
    setSelectedSegment(segmentIndex);
    
    // Scroll segment into view
    const segmentElement = document.getElementById(`segment-${segmentIndex}`);
    if (segmentElement && transcriptContainerRef.current) {
      segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToPreviousSegment = () => {
    if (selectedSegment !== null && selectedSegment > 0) {
      handleSegmentClick(selectedSegment - 1);
    }
  };

  const goToNextSegment = () => {
    if (selectedSegment !== null && selectedSegment < transcript.segments.length - 1) {
      handleSegmentClick(selectedSegment + 1);
    }
  };

  // Utility functions
  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string): string => {
    const colors = [
      'text-blue-700 bg-blue-50 border-blue-200',
      'text-green-700 bg-green-50 border-green-200', 
      'text-purple-700 bg-purple-50 border-purple-200',
      'text-orange-700 bg-orange-50 border-orange-200',
      'text-pink-700 bg-pink-50 border-pink-200',
      'text-indigo-700 bg-indigo-50 border-indigo-200',
    ];
    
    const hash = speaker.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getParticipantName = (speakerName: string) => {
    return participants.find(p => 
      `${p.first_name} ${p.last_name}` === speakerName
    )?.first_name || speakerName;
  };

  // Search functionality
  const filteredSegments = transcript.segments.filter(segment =>
    !searchQuery || segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  // Tag management
  const handleAddTag = () => {
    if (newTag.trim() && !meeting.tags.includes(newTag.trim())) {
      const updatedTags = [...meeting.tags, newTag.trim()];
      onUpdateTags?.(updatedTags);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = meeting.tags.filter(tag => tag !== tagToRemove);
    onUpdateTags?.(updatedTags);
  };

  // Note management
  const handleAddNote = () => {
    if (newNote.trim() && noteTimestamp !== null) {
      const note: MeetingNote = {
        id: Date.now().toString(),
        timestamp: noteTimestamp,
        text: newNote.trim(),
        created_by: 'current-user', // Would be actual user ID
        created_at: new Date().toISOString(),
      };
      setNotes([...notes, note]);
      onAddNote?.(noteTimestamp, newNote.trim());
      setNewNote('');
      setNoteTimestamp(null);
    }
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
    ];
    const hash = tag.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Update current segment based on audio time
  useEffect(() => {
    const updateCurrentSegment = () => {
      const currentTime = audioState.currentTime;
      const currentSegmentIndex = transcript.segments.findIndex((segment, index) => {
        const nextSegment = transcript.segments[index + 1];
        return currentTime >= segment.start_time && 
               (!nextSegment || currentTime < nextSegment.start_time);
      });
      
      if (currentSegmentIndex !== -1 && currentSegmentIndex !== selectedSegment) {
        setSelectedSegment(currentSegmentIndex);
      }
    };

    if (audioState.isPlaying) {
      const interval = setInterval(updateCurrentSegment, 100);
      return () => clearInterval(interval);
    }
  }, [audioState.currentTime, audioState.isPlaying, transcript.segments, selectedSegment]);

  return (
    <div className={`space-y-6 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      {/* Meeting Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {meeting.title}
            </h2>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(meeting.starts_at).toLocaleDateString()} • {new Date(meeting.starts_at).toLocaleTimeString()}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {participants.length} participants
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                {transcript.segments.length} segments
              </div>
            </div>

            {/* Meeting Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {meeting.tags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              
              {showTagInput ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTag}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowTagInput(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add tag
                </button>
              )}
            </div>

            {/* Meeting Summary */}
            {transcript.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Meeting Summary</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {transcript.summary}
                </p>
              </div>
            )}
          </div>

          <div className="ml-6 flex items-center space-x-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors ${
                showNotes ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <Share className="w-4 h-4" />
            </button>

            <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors">
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Audio Playback</h3>
          
          <div className="flex items-center space-x-2">
            {/* Playback Rate */}
            <select
              value={audioState.playbackRate}
              onChange={(e) => changePlaybackRate(Number(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {audioState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioState.volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16"
              />
            </div>
          </div>
        </div>
        
        {/* Audio Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={() => seekTo(Math.max(0, audioState.currentTime - 10))}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Rewind className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToPreviousSegment}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            disabled={audioState.isBuffering}
          >
            {audioState.isBuffering ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : audioState.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={goToNextSegment}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => seekTo(Math.min(audioState.duration, audioState.currentTime + 10))}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FastForward className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{formatTimestamp(audioState.currentTime)}</span>
            <span>{formatTimestamp(audioState.duration)}</span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max={audioState.duration || 1}
              value={audioState.currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            
            {/* Segment markers */}
            <div className="absolute top-0 w-full h-2 pointer-events-none">
              {transcript.segments.map((segment, index) => (
                <div
                  key={index}
                  className="absolute top-0 w-1 h-2 bg-blue-400 opacity-50"
                  style={{
                    left: `${(segment.start_time / audioState.duration) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={meeting.recording_url}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setAudioState(prev => ({ ...prev, duration: audioRef.current!.duration }));
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setAudioState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }));
            }
          }}
          onPlay={() => setAudioState(prev => ({ ...prev, isPlaying: true, isBuffering: false }))}
          onPause={() => setAudioState(prev => ({ ...prev, isPlaying: false }))}
          onWaiting={() => setAudioState(prev => ({ ...prev, isBuffering: true }))}
          onCanPlay={() => setAudioState(prev => ({ ...prev, isBuffering: false }))}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Transcript */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Transcript</h3>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transcript..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {searchQuery && (
                <div className="text-sm text-gray-600 mt-2">
                  Showing {filteredSegments.length} of {transcript.segments.length} segments
                </div>
              )}
            </div>
            
            <div 
              ref={transcriptContainerRef}
              className="p-6 max-h-[600px] overflow-y-auto space-y-4"
            >
              {filteredSegments.map((segment, index) => {
                const originalIndex = transcript.segments.indexOf(segment);
                const isActive = selectedSegment === originalIndex;
                const isCurrentSegment = audioState.currentTime >= segment.start_time && 
                                       audioState.currentTime < segment.end_time;
                
                return (
                  <div
                    key={originalIndex}
                    id={`segment-${originalIndex}`}
                    className={`flex space-x-3 p-4 rounded-lg cursor-pointer transition-all ${
                      isActive || isCurrentSegment
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    onClick={() => handleSegmentClick(originalIndex)}
                  >
                    <div className="flex-shrink-0 space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          seekTo(segment.start_time);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        {formatTimestamp(segment.start_time)}
                      </button>
                      
                      {/* Add Note Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteTimestamp(segment.start_time);
                          setShowNotes(true);
                        }}
                        className="block text-xs text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getSpeakerColor(segment.speaker)}`}>
                          {getParticipantName(segment.speaker)}
                        </span>
                        
                        {segment.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(segment.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {highlightSearchTerm(segment.text, searchQuery)}
                      </p>
                      
                      {/* Show related action items */}
                      {actionItems.filter(item => item.source_segment === originalIndex).map(item => (
                        <div key={item.id} className="mt-2 text-xs">
                          <span className="text-blue-600 font-medium">Action:</span>{' '}
                          <span className="text-gray-700">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Action Items */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b">
              <h4 className="font-semibold text-gray-900">Action Items</h4>
              <p className="text-sm text-gray-600">
                {actionItems.filter(item => item.completed).length} of {actionItems.length} completed
              </p>
            </div>
            
            <div className="p-4 space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => {
                        const updated = actionItems.map(a => 
                          a.id === item.id ? { ...a, completed: !a.completed } : a
                        );
                        setActionItems(updated);
                        onToggleActionItem?.(item.id);
                      }}
                      className={`flex-shrink-0 mt-0.5 ${
                        item.completed ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        item.completed 
                          ? 'text-green-800 line-through' 
                          : 'text-gray-800'
                      }`}>
                        {item.text}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        
                        {item.source_segment !== undefined && (
                          <button
                            onClick={() => handleSegmentClick(item.source_segment!)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Jump to segment
                          </button>
                        )}
                      </div>
                      
                      {item.assignee && (
                        <p className="text-xs text-gray-600 mt-1">
                          Assigned to: {item.assignee}
                        </p>
                      )}
                      
                      {item.dueDate && (
                        <p className="text-xs text-gray-600 mt-1">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Panel */}
          {showNotes && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-3 border-b">
                <h4 className="font-semibold text-gray-900">Meeting Notes</h4>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Add Note */}
                {noteTimestamp !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800 mb-2">
                      Add note at {formatTimestamp(noteTimestamp)}:
                    </div>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setNoteTimestamp(null);
                          setNewNote('');
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Existing Notes */}
                {notes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No notes yet. Click the + button next to any timestamp to add a note.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map(note => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <button
                            onClick={() => seekTo(note.timestamp)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-mono"
                          >
                            {formatTimestamp(note.timestamp)}
                          </button>
                          <span className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b">
              <h4 className="font-semibold text-gray-900">Participants</h4>
            </div>
            
            <div className="p-4 space-y-3">
              {participants.map(participant => (
                <div key={participant.email} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getSpeakerColor(`${participant.first_name} ${participant.last_name}`)}`}>
                    {participant.first_name[0]}{participant.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {participant.first_name} {participant.last_name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {participant.company || participant.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}