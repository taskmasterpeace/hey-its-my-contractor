'use client';

import { Meeting } from '@contractor-platform/types';
import { Calendar, Clock, Users, FileText, Mic } from 'lucide-react';

interface MeetingsListProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  selectedMeeting?: Meeting | null;
}

export function MeetingsList({ meetings, onSelectMeeting, selectedMeeting }: MeetingsListProps) {
  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Users className="w-4 h-4" />;
      case 'progress_review':
        return <FileText className="w-4 h-4" />;
      case 'change_order':
        return <Calendar className="w-4 h-4" />;
      case 'walkthrough':
        return <Mic className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return null;
    
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <Mic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
        <p className="text-gray-500">
          Start recording your first meeting to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {meetings.map((meeting) => {
        const { date, time } = formatDateTime(meeting.starts_at);
        const duration = calculateDuration(meeting.starts_at, meeting.ends_at);
        const isSelected = selectedMeeting?.id === meeting.id;

        return (
          <div
            key={meeting.id}
            className={`p-6 cursor-pointer transition-colors hover:bg-gray-50 ${
              isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
            onClick={() => onSelectMeeting(meeting)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <div className="text-gray-600 mr-2">
                    {getMeetingIcon(meeting.type)}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {meeting.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {date}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {time}
                    {duration && ` • ${duration}`}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {meeting.participants.length} participants
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(meeting.status)}`}>
                    {meeting.status.replace('_', ' ')}
                  </span>
                  
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {meeting.type.replace('_', ' ')}
                  </span>

                  {meeting.recording_url && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center">
                      <Mic className="w-3 h-3 mr-1" />
                      Recorded
                    </span>
                  )}

                  {meeting.consent_given && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Consent given
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-4 flex-shrink-0">
                {meeting.status === 'completed' && meeting.recording_url ? (
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600 mb-1">
                      Available
                    </div>
                    <div className="text-xs text-gray-500">
                      Transcript ready
                    </div>
                  </div>
                ) : meeting.status === 'scheduled' ? (
                  <div className="text-right">
                    <div className="text-sm font-medium text-yellow-600 mb-1">
                      Upcoming
                    </div>
                    <div className="text-xs text-gray-500">
                      Click to join
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      In Progress
                    </div>
                    <div className="text-xs text-gray-500">
                      Processing...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}