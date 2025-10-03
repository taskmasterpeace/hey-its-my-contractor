'use client';

import { useState, useRef, useEffect } from 'react';
import { Meeting, Transcript } from '@contractor-platform/types';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Search,
  Tag,
  Calendar,
  Users,
  Clock,
  Download,
  Share2,
  Bookmark
} from 'lucide-react';

interface EnhancedTranscriptViewerProps {
  meeting: Meeting;
  transcript: Transcript;
  audioUrl?: string;
}

export function EnhancedTranscriptViewer({ 
  meeting, 
  transcript, 
  audioUrl 
}: EnhancedTranscriptViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [tags, setTags] = useState<string[]>(['Kitchen Remodel', 'Change Order', 'Timeline']);
  const [newTag, setNewTag] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sample enhanced transcript data
  const enhancedSegments = [
    {
      id: '1',
      speaker: 'Mike Johnson',
      text: 'Good morning John and Sarah. Thanks for meeting with me today to discuss the kitchen remodel progress.',
      start: 0,
      end: 6.5,
      timestamp: '00:00',
      confidence: 0.95,
    },
    {
      id: '2', 
      speaker: 'John Smith',
      text: 'Good morning Mike. We\'re excited to hear about the progress. How are things going with the cabinet installation?',
      start: 6.5,
      end: 13.2,
      timestamp: '00:07',
      confidence: 0.92,
    },
    {
      id: '3',
      speaker: 'Mike Johnson',
      text: 'Great question. The cabinets are going in beautifully. However, we discovered the countertop measurements need adjustment. I\'d like to propose upgrading to quartz instead of laminate - it\'ll give you much better durability and appearance.',
      start: 13.2,
      end: 28.7,
      timestamp: '00:13',
      confidence: 0.94,
    },
    {
      id: '4',
      speaker: 'Sarah Smith',
      text: 'That sounds interesting. What would be the cost difference and how would it affect our timeline?',
      start: 28.7,
      end: 34.8,
      timestamp: '00:29',
      confidence: 0.91,
    },
    {
      id: '5',
      speaker: 'Mike Johnson',
      text: 'The upgrade would be an additional $3,500 for materials and installation. It would add about 5 days to the schedule since we need to template and fabricate. But the long-term value is significant.',
      start: 34.8,
      end: 47.3,
      timestamp: '00:35',
      confidence: 0.96,
    },
    {
      id: '6',
      speaker: 'John Smith',
      text: 'Let me discuss this with Sarah. Can you send us the details in writing so we can review the options?',
      start: 47.3,
      end: 53.9,
      timestamp: '00:47',
      confidence: 0.93,
    },
  ];

  const jumpToTimestamp = (seconds: number, segmentIndex: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      setSelectedSegment(segmentIndex);
      
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + 10
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string): string => {
    const colors = [
      'text-blue-700 bg-blue-50',
      'text-green-700 bg-green-50',
      'text-purple-700 bg-purple-50',
      'text-orange-700 bg-orange-50',
    ];
    
    const hash = speaker.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredSegments = enhancedSegments.filter(segment =>
    !searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {meeting.title}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(meeting.starts_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(meeting.starts_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {meeting.participants.length} participants
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${
                showSearch ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tag..."
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={addTag}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transcript..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="px-6 py-4 border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={skipBackward}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={togglePlayback}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button
                onClick={skipForward}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(53.9)} {/* Total duration */}
            </div>

            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.8"
                onChange={(e) => {
                  if (audioRef.current) {
                    audioRef.current.volume = parseFloat(e.target.value);
                  }
                }}
                className="w-16"
              />
            </div>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* Transcript */}
      <div className="px-6 py-4">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Meeting Summary</h3>
          <p className="text-gray-700 text-sm leading-relaxed bg-blue-50 p-4 rounded-lg">
            {transcript.summary || 
              "Meeting focused on kitchen remodel progress and potential upgrade to quartz countertops. Discussed cost implications ($3,500 additional) and schedule impact (+5 days). Client requested written details for review. Follow-up action items identified for material selection and timeline adjustment."
            }
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Full Transcript</h3>
          <span className="text-sm text-gray-500">
            {filteredSegments.length} of {enhancedSegments.length} segments
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>

        {/* Transcript Segments */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredSegments.map((segment, index) => (
            <div
              key={segment.id}
              className={`flex space-x-4 p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                selectedSegment === index 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'border border-transparent'
              }`}
              onClick={() => jumpToTimestamp(segment.start, index)}
            >
              {/* Timestamp */}
              <div className="flex-shrink-0 w-16">
                <button className="text-xs text-blue-600 font-mono hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded">
                  {segment.timestamp}
                </button>
              </div>
              
              {/* Speaker & Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getSpeakerColor(segment.speaker)}`}>
                    {segment.speaker}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {Math.round(segment.confidence * 100)}% confidence
                  </span>
                </div>
                
                <p className="text-gray-800 text-sm leading-relaxed">
                  {searchTerm ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: segment.text.replace(
                          new RegExp(searchTerm, 'gi'),
                          (match) => `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`
                        )
                      }}
                    />
                  ) : (
                    segment.text
                  )}
                </p>
              </div>

              {/* Action Items Indicator */}
              {segment.text.toLowerCase().includes('action') || 
               segment.text.toLowerCase().includes('follow up') ||
               segment.text.toLowerCase().includes('next step') ? (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="px-6 py-4 border-t bg-green-50">
        <h3 className="font-semibold text-gray-900 mb-3">Action Items</h3>
        <div className="space-y-2">
          {transcript.action_items?.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-800">{item}</p>
            </div>
          )) || (
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-800">Send written details for quartz countertop upgrade</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-800">Client to review and decide on countertop upgrade</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-800">Schedule follow-up meeting for next steps</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Duration: {formatTime(53.9)}</span>
            <span>Language: English</span>
            <span>Quality: High</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm transition-colors">
              <Bookmark className="w-4 h-4 mr-1" />
              Bookmark
            </button>
            <button className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors">
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}