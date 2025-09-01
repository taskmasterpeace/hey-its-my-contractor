'use client';

import { useState, useEffect } from 'react';
import { Transcript, TranscriptSegment } from '@contractor-platform/types';
import { Play, Pause, SkipBack, SkipForward, Download, CheckCircle, Circle } from 'lucide-react';

interface MeetingTranscriptProps {
  meetingId: string;
}

export function MeetingTranscript({ meetingId }: MeetingTranscriptProps) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [actionItems, setActionItems] = useState<Array<{
    id: string;
    text: string;
    completed: boolean;
    assignee?: string;
    dueDate?: string;
  }>>([]);

  // Sample transcript data
  useEffect(() => {
    const loadTranscript = async () => {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const sampleTranscript: Transcript = {
          id: 'transcript-1',
          meeting_id: meetingId,
          provider: 'assemblyai',
          language: 'en',
          text: 'Good morning, John. Thanks for meeting with me today to discuss the kitchen remodel project. I wanted to go over the progress we\'ve made so far and discuss the next steps. We\'ve completed the demolition phase and are ready to start the electrical work. I need to schedule the electrical inspection by Friday. We also need to order the new cabinets by next week.',
          segments: [
            {
              start_time: 0,
              end_time: 8.5,
              speaker: 'Mike Johnson',
              text: 'Good morning, John. Thanks for meeting with me today to discuss the kitchen remodel project.',
              confidence: 0.95,
            },
            {
              start_time: 8.5,
              end_time: 16.2,
              speaker: 'John Smith',
              text: 'Good morning, Mike. I\'m excited to hear about the progress. How are things going?',
              confidence: 0.92,
            },
            {
              start_time: 16.2,
              end_time: 28.7,
              speaker: 'Mike Johnson', 
              text: 'Great question. We\'ve completed the demolition phase and are ready to start the electrical work.',
              confidence: 0.94,
            },
            {
              start_time: 28.7,
              end_time: 38.1,
              speaker: 'Mike Johnson',
              text: 'I need to schedule the electrical inspection by Friday. We also need to order the new cabinets by next week.',
              confidence: 0.96,
            },
            {
              start_time: 38.1,
              end_time: 45.3,
              speaker: 'John Smith',
              text: 'That sounds good. Do you need my approval for the cabinet order?',
              confidence: 0.93,
            },
            {
              start_time: 45.3,
              end_time: 52.8,
              speaker: 'Mike Johnson',
              text: 'Yes, I\'ll send you the specifications and pricing by Tuesday. We can review them together.',
              confidence: 0.97,
            },
          ],
          summary: 'Meeting discussed kitchen remodel progress. Demolition complete, electrical work starting next. Key action items include scheduling electrical inspection by Friday and ordering cabinets next week.',
          action_items: [
            'Schedule electrical inspection by Friday',
            'Order new cabinets by next week',
            'Send cabinet specifications and pricing by Tuesday',
            'Review cabinet specifications together',
          ],
          created_at: new Date().toISOString(),
        };

        setTranscript(sampleTranscript);
        
        // Convert action items to trackable format
        const trackableActionItems = sampleTranscript.action_items?.map((item, index) => ({
          id: `action-${index}`,
          text: item,
          completed: index < 2, // Mark first 2 as completed for demo
          assignee: index % 2 === 0 ? 'Mike Johnson' : 'John Smith',
          dueDate: index === 0 ? '2025-01-25' : index === 1 ? '2025-01-28' : undefined,
        })) || [];
        
        setActionItems(trackableActionItems);
        setLoading(false);
      }, 1500);
    };

    loadTranscript();
  }, [meetingId]);

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSegmentClick = (segmentIndex: number) => {
    if (transcript?.segments) {
      const segment = transcript.segments[segmentIndex];
      setCurrentTime(segment.start_time);
      setSelectedSegment(segmentIndex);
    }
  };

  const toggleActionItem = (actionId: string) => {
    setActionItems(prev => 
      prev.map(item => 
        item.id === actionId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const getSpeakerColor = (speaker: string): string => {
    // Generate consistent colors for speakers
    const colors = [
      'text-blue-700 bg-blue-50',
      'text-green-700 bg-green-50', 
      'text-purple-700 bg-purple-50',
      'text-orange-700 bg-orange-50',
      'text-pink-700 bg-pink-50',
    ];
    
    const hash = speaker.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing transcript...</p>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No transcript available for this meeting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meeting Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Meeting Summary</h3>
        <p className="text-blue-800 text-sm leading-relaxed">
          {transcript.summary}
        </p>
      </div>

      {/* Audio Player Controls */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Audio Playback</h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button 
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{formatTimestamp(currentTime)}</span>
            <span>{formatTimestamp(transcript.segments?.[transcript.segments.length - 1]?.end_time || 0)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${(currentTime / (transcript.segments?.[transcript.segments.length - 1]?.end_time || 1)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Transcript</h3>
                <button className="flex items-center text-sm text-gray-600 hover:text-gray-800">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto space-y-4">
              {transcript.segments?.map((segment, index) => (
                <div
                  key={index}
                  className={`flex space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSegment === index 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSegmentClick(index)}
                >
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500 font-mono">
                      {formatTimestamp(segment.start_time)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSpeakerColor(segment.speaker)}`}>
                        {segment.speaker}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {segment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Action Items</h3>
              <p className="text-sm text-gray-600">
                {actionItems.filter(item => item.completed).length} of {actionItems.length} completed
              </p>
            </div>
            
            <div className="p-6 space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    item.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => toggleActionItem(item.id)}
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}