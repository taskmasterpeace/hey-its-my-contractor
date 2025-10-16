"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { EventClickArg, EventContentArg } from '@fullcalendar/core'
import { format } from 'date-fns'
import { useCalendar } from "@/hooks/useCalendar";

// Dynamic import to avoid SSR issues
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading calendar...</p>
      </div>
    </div>
  ),
});
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { WeatherWidget } from "@/components/calendar/WeatherWidget";
import MediaPlayer from "@/components/calendar/MediaPlayer";

export default function ProjectCalendarPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);
  // Use global calendar state
  const {
    events,
    view,
    handleEventClick: handleEventClickFromHook,
    handleEventDrop: handleEventDropFromHook,
    loadEvents,
    meetings,
    setSelectedMeeting,
  } = useCalendar();
  // Load calendar plugins
  useEffect(() => {
    const loadPlugins = async () => {
      const dayGridPlugin = (await import("@fullcalendar/daygrid")).default;
      const timeGridPlugin = (await import("@fullcalendar/timegrid")).default;
      const interactionPlugin = (await import("@fullcalendar/interaction"))
        .default;

      setCalendarPlugins([dayGridPlugin, timeGridPlugin, interactionPlugin]);
    };

    loadPlugins();
  }, []);

  // Load events on mount for this specific project
  useEffect(() => {
    if (projectId) {
      loadEvents(projectId);
    }
  }, [loadEvents, projectId]);

  // Filter events for this project only
  const projectEvents = events.filter(
    (event) => event.project_id === projectId
  );

  const handleEventClickLocal = (clickInfo: EventClickArg) => {
    handleEventClickFromHook(clickInfo);

    // Find the meeting associated with this event
    const meetingId = clickInfo.event.extendedProps.meeting_id;
    if (meetingId) {
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting) {
        setSelectedMeeting(meeting);
      } else {
        console.warn('⚠️ Meeting not found in meetings array');
      }
    } else {
      console.warn('⚠️ No meeting_id in event extendedProps');
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { title, end } = eventInfo.event
    const timeString = end ? format(end, 'hh:mm a') : ''
    return (
      <div className="fc-event-main p-1 text-xs w-full flex-wrap overflow-auto">
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-xs break-words whitespace-normal text-primary-900">
              {title || 'Untitled Recording'}
            </span>
          </div>
          <span className="text-xs whitespace-nowrap text-primary-900">
            {timeString}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Fragment>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Calendar Command Center
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage meetings, deliveries, and project milestones
              </p>
            </div>
            <div className="flex items-center gap-4">
              <WeatherWidget />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar - Full width on mobile, fixed width on desktop */}
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r">
            <CalendarSidebar events={projectEvents} />
          </div>

          {/* Main Calendar */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 lg:p-6">
                {calendarPlugins.length > 0 ? (
                  <FullCalendar
                    plugins={calendarPlugins}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,timeGridWeek,timeGridDay",
                    }}
                    dayMaxEvents={2}
                    moreLinkClassNames="flex justify-center items-center text-blue-800 text-xs font-medium"
                    eventClassNames={() => [
                      'cursor-pointer',
                      'bg-blue-100',
                      'text-blue-900',
                      'border',
                      'border-blue-100',
                      'hover:bg-blue-400',
                    ]}
                    dayCellClassNames="hover:bg-primary-100 p-1"
                    eventContent={renderEventContent}
                    initialView={view}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    weekends={true}
                    events={projectEvents.map((event) => ({
                      id: event.id,
                      title: event.title,
                      start: event.start,
                      end: event.end,
                      backgroundColor: event.color,
                      borderColor: event.color,
                      textColor: "#ffffff",
                      extendedProps: {
                        type: event.type,
                        project_id: event.project_id,
                        meeting_id: event.meeting_id,
                        metadata: event.metadata,
                      },
                    }))}
                    eventClick={handleEventClickLocal}
                    eventDrop={handleEventDropFromHook}
                    eventResize={handleEventDropFromHook}
                    height="auto"
                    aspectRatio={1.5}
                    eventDisplay="block"
                    displayEventTime={view !== "dayGridMonth"}
                    eventTimeFormat={{
                      hour: "numeric",
                      minute: "2-digit",
                      omitZeroMinute: false,
                      meridiem: "short",
                    }}
                  />
                ) : (
                  <div className="h-48 md:h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm md:text-base text-gray-600">Loading calendar plugins...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaPlayer />
    </Fragment>
  );
}
