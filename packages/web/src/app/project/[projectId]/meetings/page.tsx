"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Meeting,
  Transcript,
  MeetingSearchFilters,
  EnhancedMeetingData,
  MeetingTag,
} from "@contractor-platform/types";
import { MeetingRecorder } from "@/components/meetings/MeetingRecorder";
import { EnhancedMeetingTranscript } from "@/components/meetings/EnhancedMeetingTranscript";
import { MeetingSearch } from "@/components/meetings/MeetingSearch";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingTagManager } from "@/components/meetings/MeetingTagManager";
import {
  sampleEnhancedMeetings,
  sampleMeetingTags,
  sampleSearchResults,
  sampleParticipants,
  sampleProjects,
  getEnhancedMeetingById,
} from "@/components/meetings/demo-data";
import {
  Play,
  Square,
  Mic,
  Users,
  Clock,
  FileText,
  Search,
  Filter,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function ProjectMeetingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [meetings, setMeetings] = useState<EnhancedMeetingData[]>(
    sampleEnhancedMeetings
  );
  const [selectedMeeting, setSelectedMeeting] =
    useState<EnhancedMeetingData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentView, setCurrentView] = useState<
    "list" | "search" | "transcript"
  >("list");
  const [searchResults, setSearchResults] = useState(sampleSearchResults);
  const [availableTags, setAvailableTags] =
    useState<MeetingTag[]>(sampleMeetingTags);
  const [isSearching, setIsSearching] = useState(false);

  // Filter meetings for this specific project
  const projectMeetings = meetings.filter(
    (meeting) => meeting.meeting.project_id === projectId
  );

  // Search functionality
  const handleSearch = async (filters: MeetingSearchFilters) => {
    setIsSearching(true);

    // Simulate API call delay
    setTimeout(() => {
      // In a real app, this would call an API filtered by projectId
      let filteredResults = searchResults.filter(
        (result) => result.meeting.project_id === projectId
      );

      if (filters.query) {
        filteredResults = filteredResults.filter(
          (result) =>
            result.meeting.title
              .toLowerCase()
              .includes(filters.query!.toLowerCase()) ||
            result.meeting.tags.some((tag) =>
              tag.toLowerCase().includes(filters.query!.toLowerCase())
            )
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredResults = filteredResults.filter((result) =>
          filters.tags!.some((filterTag) =>
            result.meeting.tags.includes(filterTag)
          )
        );
      }

      setSearchResults(filteredResults);
      setIsSearching(false);
    }, 800);
  };

  const handleSelectMeetingFromSearch = (meeting: EnhancedMeetingData) => {
    setSelectedMeeting(meeting);
    setCurrentView("transcript");
  };

  const handleCreateTag = (tagName: string, color: string) => {
    const newTag: MeetingTag = {
      id: `tag-${Date.now()}`,
      name: tagName,
      color,
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
    setAvailableTags([...availableTags, newTag]);
  };

  const handleUpdateTag = (tagId: string, updates: Partial<MeetingTag>) => {
    setAvailableTags((tags) =>
      tags.map((tag) => (tag.id === tagId ? { ...tag, ...updates } : tag))
    );
  };

  const handleDeleteTag = (tagId: string) => {
    setAvailableTags((tags) => tags.filter((tag) => tag.id !== tagId));
  };

  const handleUpdateMeetingTags = (meetingId: string, newTags: string[]) => {
    setMeetings((meetings) =>
      meetings.map((meeting) =>
        meeting.meeting.id === meetingId
          ? { ...meeting, meeting: { ...meeting.meeting, tags: newTags } }
          : meeting
      )
    );
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);

    // Start timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Store timer reference for cleanup
    (window as any).recordingTimer = timer;
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    // Clean up timer
    if ((window as any).recordingTimer) {
      clearInterval((window as any).recordingTimer);
      delete (window as any).recordingTimer;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Meeting Intelligence
            </h1>
            <p className="text-gray-600">
              Record meetings, generate transcripts, and extract action items
              automatically
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentView("list")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Meetings
            </button>

            <button
              onClick={() => setCurrentView("search")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "search"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Search className="w-4 h-4 mr-2 inline" />
              Search
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Meetings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {projectMeetings.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mic className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Recorded</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    projectMeetings.filter((m) => m.meeting.recording_url)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Action Items
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {projectMeetings.reduce(
                    (sum, m) => sum + (m.action_items_count || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Filter className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Tags</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableTags.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentView === "search" ? (
        <MeetingSearch
          onSearch={handleSearch}
          results={searchResults}
          onSelectMeeting={handleSelectMeetingFromSearch}
          availableTags={availableTags.map((tag) => tag.name)}
          availableParticipants={sampleParticipants.map((p) => ({
            id: p.email,
            name: `${p.first_name} ${p.last_name}`,
          }))}
          availableProjects={[
            {
              id: projectId,
              name: "Current Project",
            },
          ]}
          isLoading={isSearching}
        />
      ) : currentView === "transcript" && selectedMeeting ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView("list")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Meetings
            </button>
          </div>

          {selectedMeeting.transcript ? (
            <EnhancedMeetingTranscript
              meeting={selectedMeeting.meeting}
              transcript={selectedMeeting.transcript}
              participants={selectedMeeting.participants}
              onUpdateTags={(tags) =>
                handleUpdateMeetingTags(selectedMeeting.meeting.id, tags)
              }
            />
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Transcript Available
              </h3>
              <p className="text-gray-500">
                This meeting doesn't have a transcript yet. Transcripts are
                automatically generated after meeting recordings are processed.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Recording Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Record Meeting
              </h2>

              {/* Recording Status */}
              <div className="text-center mb-6">
                <div
                  className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isRecording
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Mic className="w-10 h-10" />
                </div>

                <div className="text-2xl font-mono font-bold text-gray-900 mb-2">
                  {formatDuration(recordingDuration)}
                </div>

                <div
                  className={`text-sm font-medium ${
                    isRecording ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {isRecording ? "Recording in progress..." : "Ready to record"}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </button>
                )}
              </div>

              {/* Meeting Info Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter meeting title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="consultation">Initial Consultation</option>
                    <option value="progress_review">Progress Review</option>
                    <option value="change_order">
                      Change Order Discussion
                    </option>
                    <option value="walkthrough">Final Walkthrough</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <MeetingTagManager
                    availableTags={availableTags}
                    selectedTags={[]}
                    onTagsChange={() => {}}
                    onCreateTag={handleCreateTag}
                    onUpdateTag={handleUpdateTag}
                    onDeleteTag={handleDeleteTag}
                    placeholder="Add meeting tags..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <Users className="w-4 h-4 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium">
                        Consent Required
                      </p>
                      <p className="text-blue-600">
                        All participants will be informed that this meeting is
                        being recorded and transcribed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meetings List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Meetings
                </h2>
                <div className="text-sm text-gray-600">
                  {projectMeetings.length} meetings total
                </div>
              </div>

              {projectMeetings.length === 0 ? (
                <div className="bg-white rounded-lg border p-8 text-center">
                  <Mic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No meetings yet
                  </h3>
                  <p className="text-gray-500">
                    Start recording your first meeting to see it here
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {projectMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.meeting.id}
                      meeting={meeting}
                      variant="default"
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setCurrentView("transcript");
                      }}
                      onViewTranscript={() => {
                        setSelectedMeeting(meeting);
                        setCurrentView("transcript");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
