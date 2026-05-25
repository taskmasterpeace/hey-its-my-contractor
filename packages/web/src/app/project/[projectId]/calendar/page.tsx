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
    <div className="h-64 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--ft-paper-2)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--ft-hi-vis)' }}></div>
        <p style={{ color: 'var(--ft-steel)' }}>Loading calendar...</p>
      </div>
    </div>
  ),
});
import { TaskSchedulerModal, TaskFormData } from "@/components/calendar/TaskSchedulerModal";
import { useAuth } from "@/contexts/AuthContext";
import { Meeting } from "@contractor-platform/types";
import MediaPlayer from "@/components/calendar/MediaPlayer";
import { CalendarIcon } from "lucide-react";

export default function ProjectCalendarPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Get current user
  const { user } = useAuth();
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
      const meeting = meetings.find((m: Meeting) => m.id === meetingId);
      if (meeting) {
        setSelectedMeeting(meeting);

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
    };
  }

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { title, end, extendedProps } = eventInfo.event
    const timeString = end ? format(end, 'hh:mm a') : ''
    const isScheduledTask = extendedProps.type === 'scheduled_task'
    return (
      <div className="fc-event-main p-1 text-xs w-full flex-wrap overflow-auto">
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {isScheduledTask && (
              <CalendarIcon className="h-4 w-4 text-primary-900 flex-shrink-0" />
            )}
            {isScheduledTask ? (
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs font-semibold break-words line-clamp-1 whitespace-normal text-primary-900">
                  {extendedProps.metadata?.name || 'Unknown'}
                </span>
                {extendedProps.metadata?.task && (
                  <span className="text-xs break-words line-clamp-1 overflow-hidden w-[125px] whitespace-normal text-primary-700">
                    {extendedProps.metadata.task}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs break-words line-clamp-1 whitespace-normal text-primary-900">
                {title || 'Untitled Recording'}
              </span>
            )}
          </div>
          <span className="text-xs whitespace-nowrap text-primary-900 ml-1">
            {timeString}
          </span>
        </div>
      </div>
    )
  }

  const handleDateClick = (dateClickInfo: any) => {
    const clickedDate = dateClickInfo.date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (clickedDate > today) {
      setSelectedDate(clickedDate);
      setModalOpen(true);
      console.warn('⚠️ Meeting not found in meetings array');
    }
  }

  // Handle task scheduling
  const handleScheduleTask = async (formData: TaskFormData) => {
    if (!selectedDate || !user) return;

    try {
      const response = await fetch('/api/schedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId: user.id,
          name: formData.name,
          mobileNumber: formData.mobileNumber,
          dateAndTime: formData.time, // Already ISO string
          task: formData.task,
          notificationTimes: formData.notificationTimes
        })
      });

      if (!response.ok) throw new Error('Failed to schedule task');

      const result = await response.json();
      console.log('Task scheduled:', result);

      // Reload calendar events to show the newly scheduled task
      await loadEvents(projectId);
    } catch (error) {
      console.error('Error scheduling task:', error);
      throw error;
    }
  };

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);

  return (
    <Fragment>
      <div style={{ padding: "28px 28px 56px", maxWidth: 1400 }}>
        {/* Editorial header — matches design */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div
              className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--ft-steel)" }}
            >
              Calendar · Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <h1
              className="font-display"
              style={{ fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em", margin: "6px 0 0", color: "var(--ft-ink)" }}
            >
              Week {Math.ceil(now.getDate() / 7)} · Drywall &amp; finish prep
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 text-[12px] font-medium rounded cursor-pointer"
              style={{ background: "var(--ft-paper-2)", color: "var(--ft-steel)", border: "1px solid var(--ft-rule)" }}
            >
              Week
            </span>
            <span
              className="px-2.5 py-1 text-[12px] font-medium rounded cursor-pointer"
              style={{ background: "var(--ft-ink)", color: "#fff" }}
            >
              Month
            </span>
          </div>
        </div>

        {/* Full-width calendar card — no sidebar */}
        <div
          className="rounded"
          style={{ background: "var(--ft-paper)", border: "1px solid var(--ft-rule)", overflow: "hidden" }}
        >
          <div className="p-0">
            {calendarPlugins.length > 0 ? (
              <FullCalendar
                plugins={calendarPlugins}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridWeek,dayGridMonth,timeGridDay",
                }}
                dayMaxEvents={2}
                moreLinkClassNames="flex justify-center items-center text-xs font-medium"
                eventClassNames={() => [
                  'cursor-pointer',
                  '!border-0',
                  '!rounded-sm',
                ]}
                dateClick={handleDateClick}
                dayCellClassNames="p-1"
                eventContent={renderEventContent}
                initialView="timeGridWeek"
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
                eventDisplay="block"
                displayEventTime={true}
                slotMinTime="07:00:00"
                slotMaxTime="18:00:00"
                allDaySlot={false}
                eventTimeFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  omitZeroMinute: false,
                  meridiem: "short",
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ minHeight: 400, background: "var(--ft-paper-2)" }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{ borderColor: "var(--ft-hi-vis)" }} />
                  <p className="text-sm" style={{ color: "var(--ft-steel)" }}>Loading calendar…</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <MediaPlayer />
      <TaskSchedulerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        onSubmit={handleScheduleTask}
      />
    </Fragment>
  );
}
