'use client';

import { useState } from 'react';
import {
  EnhancedMeetingData
} from '@contractor-platform/types';
import {
  Calendar,
  Clock,
  Users,
  Mic,
  FileText,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Tag as TagIcon,
  MapPin,
  Phone,
  Video,
  ArrowRight,
  Download,
  Share,
  MoreHorizontal,
} from 'lucide-react';

interface MeetingCardProps {
  meeting: EnhancedMeetingData;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onClick?: () => void;
  onJoinMeeting?: () => void;
  onViewTranscript?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  className?: string;
}

export function MeetingCard({
  meeting,
  variant = 'default',
  showActions = true,
  onClick,
  onJoinMeeting,
  onViewTranscript,
  onDownload,
  onShare,
  className = '',
}: MeetingCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getMeetingIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'consultation': return <Users className={iconClass} />;
      case 'progress_review': return <FileText className={iconClass} />;
      case 'change_order': return <AlertCircle className={iconClass} />;
      case 'walkthrough': return <MapPin className={iconClass} />;
      case 'inspection': return <CheckCircle className={iconClass} />;
      default: return <Calendar className={iconClass} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'progress_review':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'change_order':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'walkthrough':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'inspection':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    let dateLabel = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    if (isToday) dateLabel = 'Today';
    if (isTomorrow) dateLabel = 'Tomorrow';

    const timeLabel = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return { date: dateLabel, time: timeLabel };
  };

  const getMeetingDuration = () => {
    if (!meeting.meeting.ends_at) return null;
    const start = new Date(meeting.meeting.starts_at);
    const end = new Date(meeting.meeting.ends_at);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const getActionItemsProgress = () => {
    if (!meeting.action_items_count) return null;
    const completed = meeting.completed_actions || 0;
    const total = meeting.action_items_count;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const { date, time } = formatDateTime(meeting.meeting.starts_at);
  const duration = getMeetingDuration();
  const actionProgress = getActionItemsProgress();

  if (variant === 'compact') {
    return (
      <div
        className={`bg-white border rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${className}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className={`p-2 rounded-lg border ${getTypeColor(meeting.meeting.type)}`}>
                {getMeetingIcon(meeting.meeting.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {meeting.meeting.title}
              </h3>

              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                <span>{date} • {time}</span>
                {duration && <span>{duration}</span>}
                <span>{meeting.participants.length} participants</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(meeting.meeting.status)}`}>
              {meeting.meeting.status.replace('_', ' ')}
            </span>

            {meeting.meeting.recording_url && (
              <Mic className="w-4 h-4 text-green-600" />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className={`p-3 rounded-lg border ${getTypeColor(meeting.meeting.type)}`}>
                {getMeetingIcon(meeting.meeting.type)}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {meeting.meeting.title}
                </h3>

                <div className="text-sm text-gray-600 mb-2">
                  {meeting.project.name} • {meeting.project.address}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {date} • {time}
                  </div>

                  {duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {duration}
                    </div>
                  )}

                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {meeting.participants.length} participants
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {showActions && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <button
                        onClick={() => {
                          onViewTranscript?.();
                          setShowMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Transcript
                      </button>

                      <button
                        onClick={() => {
                          onDownload?.();
                          setShowMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>

                      <button
                        onClick={() => {
                          onShare?.();
                          setShowMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {meeting.meeting.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {meeting.meeting.tags.slice(0, 4).map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {meeting.meeting.tags.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{meeting.meeting.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Status and Features */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(meeting.meeting.status)}`}>
                {meeting.meeting.status.replace('_', ' ')}
              </span>

              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(meeting.meeting.type)}`}>
                {meeting.meeting.type.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {meeting.meeting.consent_given && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                  Consent given
                </span>
              )}

              {meeting.meeting.recording_url && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full border border-blue-200 flex items-center">
                  <Mic className="w-3 h-3 mr-1" />
                  Recorded
                </span>
              )}

              {meeting.transcript && (
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full border border-purple-200 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  Transcript
                </span>
              )}
            </div>
          </div>

          {/* Action Items Progress */}
          {actionProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Action Items</span>
                <span className="text-gray-900 font-medium">
                  {actionProgress.completed}/{actionProgress.total} completed
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${actionProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium text-gray-700">Participants:</span>
            <div className="flex -space-x-2">
              {meeting.participants.slice(0, 4).map((participant) => (
                <div
                  key={participant.email}
                  className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium text-blue-700"
                  title={`${participant.full_name}`}
                >
                  {participant.full_name[0]}
                </div>
              ))}
              {meeting.participants.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{meeting.participants.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {meeting.meeting.status === 'scheduled' && meeting.meeting.external_provider && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinMeeting?.();
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {meeting.meeting.external_provider === 'zoom' ? <Video className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                    Join Meeting
                  </button>
                )}

                {meeting.meeting.status === 'completed' && meeting.transcript && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTranscript?.();
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    View Transcript
                  </button>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`w-full bg-white border rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg border ${getTypeColor(meeting.meeting.type)}`}>
            {getMeetingIcon(meeting.meeting.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {meeting.meeting.title}
            </h3>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {date} • {time}
              </div>

              {duration && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {duration}
                </div>
              )}

              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {meeting.participants.length} participants
              </div>
            </div>

            {/* Tags */}
            {meeting.meeting.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {meeting.meeting.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {meeting.meeting.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{meeting.meeting.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(meeting.meeting.status)}`}>
            {meeting.meeting.status.replace('_', ' ')}
          </span>

          {meeting.meeting.recording_url && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200 flex items-center">
              <Mic className="w-3 h-3 mr-1" />
              Audio
            </span>
          )}

          {meeting.transcript && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full border border-blue-200 flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              Transcript
            </span>
          )}
        </div>
      </div>

      {/* Progress and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{meeting.project.name}</span>
          </div>

          {actionProgress && (
            <div className="text-sm text-gray-600">
              Actions: {actionProgress.completed}/{actionProgress.total} completed
            </div>
          )}
        </div>

        {showActions && meeting.meeting.status === 'completed' && meeting.transcript && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewTranscript?.();
            }}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            View
          </button>
        )}
      </div>
    </div>
  );
}