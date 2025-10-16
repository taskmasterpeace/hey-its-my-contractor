"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  EnhancedMeetingData,
  MeetingTag,
} from "@contractor-platform/types";
// import { EnhancedMeetingTranscript } from "@/components/meetings/EnhancedMeetingTranscript";
import { MeetingSearch } from "@/components/meetings/MeetingSearch";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingTagManager } from "@/components/meetings/MeetingTagManager";
import { useProjectMeetings } from "@/hooks/useProjectMeetings";
import {
  sampleMeetingTags,
} from "@/components/meetings/demo-data";
import {
  Play,
  Square,
  Mic,
  Users,
  FileText,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Pause,
  MicOff,
  Loader2Icon,
} from "lucide-react";
import useRecorder from "@/hooks/useRecorder";
import LiveTranscription from "@/components/meetings/LiveTranscription";
import NavigationConfirmationDialog from "@/components/meetings/NavigationConfirmationDialog";
import MediaPlayer from "@/components/calendar/MediaPlayer";
import { useAppStore } from "@/store";
import { TRANSCRIPTION_STATUS } from "@/constants";

export default function ProjectMeetingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState("consultation");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMeetingTitleError, setShowMeetingTitleError] = useState(false);

  // Fetch meetings from Supabase with real-time updates
  const { meetings, loading: meetingsLoading, error: meetingsError, refetch } = useProjectMeetings(projectId);

  const [currentView, setCurrentView] = useState<"list" | "search">("list");
  const setSelectedMeetingInStore = useAppStore((state) => state.setSelectedMeeting);

  const [availableTags, setAvailableTags] =
    useState<MeetingTag[]>(sampleMeetingTags);

  // Filter meetings for this specific project
  const projectMeetings = meetings.filter(
    (meeting) => meeting.meeting.project_id === projectId
  );

  // recent 5 last meetings based on created_at
  const recentMeetings = projectMeetings.slice().sort((a, b) => new Date(b.meeting.created_at).getTime() - new Date(a.meeting.created_at).getTime()).slice(0, 5);

  const handleSelectMeetingFromSearch = (meeting: EnhancedMeetingData) => {
    setSelectedMeetingInStore(meeting.meeting);
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const {
    isRecording,
    isUploading,
    startRecording,
    stopRecording,
    status,
    recordingDuration,
    isMuted,
    isPaused,
    toggleMute,
    togglePause,
    transcripts,
    resetRecording,
  } = useRecorder({ meetingTitle, setShowMeetingTitleError, selectedTags });

  // Reset form fields
  const resetForm = () => {
    setMeetingTitle("");
    setMeetingType("consultation");
    setSelectedTags([]);
    setShowMeetingTitleError(false);
    resetRecording();
  };

  // Handle stop recording with reset
  const handleStopRecording = async () => {
    // Collect meeting data before stopping
    const meetingData = {
      title: meetingTitle,
      type: meetingType,
      tags: selectedTags,
      projectId: projectId,
      duration: recordingDuration,
      recordedAt: new Date().toISOString(),
    };

    console.log("📝 Saving meeting with metadata:", meetingData);
    console.log("🏷️ Selected tags:", selectedTags);
    console.log("📋 Meeting type:", meetingType);

    // Stop recording (this will save transcripts)
    await stopRecording();

    // Refetch meetings to get the newly created meeting
    setTimeout(() => {
      refetch();
    }, 1000);

    // Reset form after a short delay to allow save to complete
    setTimeout(() => {
      resetForm();
    }, 500);
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
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Meetings
            </button>

            <button
              onClick={() => setCurrentView("search")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "search"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
          projectId={projectId}
          onSelectMeeting={handleSelectMeetingFromSearch}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recording Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Record Meeting
              </h2>

              {/* Recording Status */}
              <div className="text-center mb-6">
                <div
                  className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${isRecording
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
                  className={`text-sm font-medium ${isPaused
                    ? "text-yellow-600"
                    : isRecording && !isPaused
                      ? "text-red-600"
                      : isUploading
                        ? "text-blue-600"
                        : status === TRANSCRIPTION_STATUS.ERROR
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                >
                  {isUploading
                    ? "Uploading recording..."
                    : isPaused && isRecording
                      ? "Recording paused"
                      : status === TRANSCRIPTION_STATUS.LISTENING && !isPaused
                        ? "Recording in progress..."
                        : status === TRANSCRIPTION_STATUS.CONNECTING
                          ? "Trying to connect..."
                          : status === TRANSCRIPTION_STATUS.ERROR
                            ? "Error occurred"
                            : "Ready to record"}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center space-x-2 mb-6">
                <div className="">
                  {isUploading ? (
                    <button
                      disabled
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-not-allowed opacity-75"
                    >
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </button>
                  ) : status === TRANSCRIPTION_STATUS.IDLE && !isRecording ? (
                    <button
                      onClick={() => startRecording(projectId, meetingType)}
                      className="flex items-center px-4 text-nowrap py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </button>
                  ) : status === TRANSCRIPTION_STATUS.LISTENING || isPaused ? (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center text-nowrap px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </button>
                  ) : (
                    status === TRANSCRIPTION_STATUS.CONNECTING && (
                      <button
                        onClick={handleStopRecording}
                        className="flex items-center text-nowrap px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </button>
                    )
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 lg:gap-1">
                  <button
                    onClick={togglePause}
                    disabled={!isRecording || isUploading}
                    className={`flex items-center justify-center w-10 h-10 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg transition-colors ${isPaused
                      ? "bg-yellow-500 text-white border-2 border-yellow-600"
                      : "bg-white border-2 border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
                      }`}
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleMute(!isMuted)}
                    disabled={!isRecording || isUploading}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isMuted
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Meeting Info Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter meeting title"
                    value={meetingTitle}
                    onChange={(e) => {
                      setMeetingTitle(e.target.value);
                      setShowMeetingTitleError(false);
                    }}
                    disabled={isRecording || isUploading}
                  />
                  {showMeetingTitleError && (
                    <p className="text-xs text-red-500 mt-1">
                      Meeting Title is Required
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    disabled={isRecording}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      Select a meeting type
                    </option>
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
                  <div
                    className={
                      isRecording || isUploading ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <MeetingTagManager
                      availableTags={availableTags}
                      selectedTags={selectedTags}
                      onTagsChange={setSelectedTags}
                      onCreateTag={handleCreateTag}
                      onUpdateTag={handleUpdateTag}
                      onDeleteTag={handleDeleteTag}
                      placeholder="Add meeting tags..."
                    />
                  </div>
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
            {/* Create nested grid for transcription and meetings list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LiveTranscription - 2 columns on large screens */}
              <div className="lg:col-span-3 h-full">
                <LiveTranscription
                  transcripts={transcripts}
                  status={status}
                  isPaused={isPaused}
                />
              </div>

              {/* Recent Meetings - 1 column on large screens */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Meetings
                  </h2>
                  <div className="text-sm text-gray-600">
                    {recentMeetings.length} recent meetings
                  </div>
                </div>

                {meetingsLoading ? (
                  <div className="bg-white rounded-lg border p-8 text-center">
                    <Loader2Icon className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Loading meetings...
                    </h3>
                    <p className="text-gray-500">
                      Fetching your meetings from the database
                    </p>
                  </div>
                ) : meetingsError ? (
                  <div className="bg-white rounded-lg border p-8 text-center">
                    <FileText className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Error loading meetings
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {meetingsError.message}
                    </p>
                    <button
                      onClick={refetch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : recentMeetings.length === 0 ? (
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
                  <div className="grid gap-4 pb-4">
                    {recentMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.meeting.id}
                        meeting={meeting}
                        variant="default"
                        onClick={() => {
                          setSelectedMeetingInStore(meeting.meeting);
                        }}
                        onViewTranscript={() => {
                          setSelectedMeetingInStore(meeting.meeting);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Confirmation Dialog */}
      <NavigationConfirmationDialog
        isRecording={isRecording}
        onConfirmLeave={async () => await stopRecording()}
      />
      {/* Media Player */}
      <MediaPlayer />
    </div>
  );
}
