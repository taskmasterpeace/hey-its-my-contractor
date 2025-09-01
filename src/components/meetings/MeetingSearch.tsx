'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Users, 
  Tag, 
  FolderOpen,
  Mic,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  MeetingSearchFilters, 
  MeetingSearchResult, 
  MeetingType, 
  MeetingStatus,
  EnhancedMeetingData 
} from '@contractor-platform/types';

interface MeetingSearchProps {
  onSearch: (filters: MeetingSearchFilters) => void;
  results: MeetingSearchResult[];
  onSelectMeeting: (meeting: EnhancedMeetingData) => void;
  availableTags: string[];
  availableParticipants: { id: string; name: string }[];
  availableProjects: { id: string; name: string }[];
  isLoading?: boolean;
}

export function MeetingSearch({
  onSearch,
  results,
  onSelectMeeting,
  availableTags,
  availableParticipants,
  availableProjects,
  isLoading = false,
}: MeetingSearchProps) {
  const [filters, setFilters] = useState<MeetingSearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Predefined tag suggestions with colors
  const tagColors = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    electrical: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    plumbing: 'bg-blue-100 text-blue-700 border-blue-200',
    permits: 'bg-purple-100 text-purple-700 border-purple-200',
    inspection: 'bg-green-100 text-green-700 border-green-200',
    'change-order': 'bg-orange-100 text-orange-700 border-orange-200',
    'client-request': 'bg-pink-100 text-pink-700 border-pink-200',
    materials: 'bg-gray-100 text-gray-700 border-gray-200',
    scheduling: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    budget: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const meetingTypeLabels: Record<MeetingType, string> = {
    consultation: 'Initial Consultation',
    progress_review: 'Progress Review',
    change_order: 'Change Order',
    walkthrough: 'Walkthrough',
    inspection: 'Inspection',
  };

  const statusLabels: Record<MeetingStatus, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      onSearch({ ...filters, query: searchQuery });
    }, 300);

    return () => clearTimeout(debounce);
  }, [filters, searchQuery, onSearch]);

  const addFilter = (type: keyof MeetingSearchFilters, value: any) => {
    setFilters(prev => {
      const currentValue = prev[type] as any[];
      if (Array.isArray(currentValue)) {
        if (!currentValue.includes(value)) {
          return { ...prev, [type]: [...currentValue, value] };
        }
      } else {
        return { ...prev, [type]: [value] };
      }
      return prev;
    });
  };

  const removeFilter = (type: keyof MeetingSearchFilters, value: any) => {
    setFilters(prev => {
      const currentValue = prev[type] as any[];
      if (Array.isArray(currentValue)) {
        return { ...prev, [type]: currentValue.filter(v => v !== value) };
      }
      return prev;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.participants?.length) count += filters.participants.length;
    if (filters.projects?.length) count += filters.projects.length;
    if (filters.types?.length) count += filters.types.length;
    if (filters.status?.length) count += filters.status.length;
    if (filters.dateRange) count++;
    if (filters.hasRecording !== undefined) count++;
    if (filters.hasTranscript !== undefined) count++;
    return count;
  }, [filters, searchQuery]);

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

  const getTagColor = (tag: string) => {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
    return tagColors[normalizedTag as keyof typeof tagColors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => (
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : part
    ));
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, transcripts, participants..."
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Filters:</span>
              
              {filters.tags?.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => removeFilter('tags', tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.participants?.map(participantId => {
                const participant = availableParticipants.find(p => p.id === participantId);
                return (
                  <span
                    key={participantId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    {participant?.name || participantId}
                    <button
                      onClick={() => removeFilter('participants', participantId)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              {filters.projects?.map(projectId => {
                const project = availableProjects.find(p => p.id === projectId);
                return (
                  <span
                    key={projectId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                  >
                    <FolderOpen className="w-3 h-3 mr-1" />
                    {project?.name || projectId}
                    <button
                      onClick={() => removeFilter('projects', projectId)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-red-600 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-1">
                    {availableTags.slice(0, 5).map(tag => (
                      <button
                        key={tag}
                        onClick={() => 
                          filters.tags?.includes(tag) 
                            ? removeFilter('tags', tag)
                            : addFilter('tags', tag)
                        }
                        className={`block w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                          filters.tags?.includes(tag)
                            ? getTagColor(tag)
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <div className="space-y-1">
                    {Object.entries(meetingTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => 
                          filters.types?.includes(type as MeetingType)
                            ? removeFilter('types', type)
                            : addFilter('types', type)
                        }
                        className={`block w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                          filters.types?.includes(type as MeetingType)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="space-y-1">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <button
                        key={status}
                        onClick={() => 
                          filters.status?.includes(status as MeetingStatus)
                            ? removeFilter('status', status)
                            : addFilter('status', status)
                        }
                        className={`block w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                          filters.status?.includes(status as MeetingStatus)
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="space-y-1">
                    <button
                      onClick={() => 
                        setFilters(prev => ({ 
                          ...prev, 
                          hasRecording: prev.hasRecording === true ? undefined : true 
                        }))
                      }
                      className={`flex items-center w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                        filters.hasRecording === true
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      Has Recording
                    </button>
                    <button
                      onClick={() => 
                        setFilters(prev => ({ 
                          ...prev, 
                          hasTranscript: prev.hasTranscript === true ? undefined : true 
                        }))
                      }
                      className={`flex items-center w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                        filters.hasTranscript === true
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Has Transcript
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching meetings...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilterCount > 0 ? 'No meetings found' : 'Start searching'}
            </h3>
            <p className="text-gray-500">
              {activeFilterCount > 0 
                ? 'Try adjusting your search criteria or filters'
                : 'Enter keywords or use filters to find meetings'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found {results.length} meeting{results.length !== 1 ? 's' : ''}
            </div>
            
            {results.map((result) => {
              const { date, time } = formatDateTime(result.meeting.starts_at);
              
              return (
                <div
                  key={result.meeting.id}
                  className="bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelectMeeting({
                    meeting: result.meeting,
                    project: { id: result.meeting.project_id } as any, // Will be populated by parent
                    participants: [], // Will be populated by parent
                  })}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {highlightText(result.meeting.title, searchQuery)}
                        </h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {date} • {time}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {result.meeting.participants.length} participants
                          </div>
                        </div>

                        {/* Tags */}
                        {result.meeting.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {result.meeting.tags.map(tag => (
                              <span
                                key={tag}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Transcript Highlights */}
                        {result.highlights?.transcript && result.highlights.transcript.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                            <div className="text-sm font-medium text-yellow-800 mb-2">
                              Transcript matches:
                            </div>
                            {result.highlights.transcript.slice(0, 2).map((highlight, index) => (
                              <div key={index} className="text-sm text-yellow-700 mb-1">
                                <span className="font-medium">{highlight.speaker}:</span>{' '}
                                <span dangerouslySetInnerHTML={{ __html: highlight.highlightedText }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.meeting.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : result.meeting.status === 'scheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {statusLabels[result.meeting.status]}
                        </span>

                        <div className="flex items-center space-x-2">
                          {result.meeting.recording_url && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center">
                              <Mic className="w-3 h-3 mr-1" />
                              Audio
                            </span>
                          )}
                          
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            Transcript
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">
                          Relevance: {Math.round(result.relevanceScore * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}