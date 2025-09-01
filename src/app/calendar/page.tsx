'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCalendar } from '@/hooks/useCalendar';

// Dynamic import to avoid SSR issues
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
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
import { CalendarEventModal } from '@/components/calendar/CalendarEventModal';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { WeatherWidget } from '@/components/calendar/WeatherWidget';

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);
  
  // Use global calendar state
  const {
    events,
    selectedEvent,
    view,
    loading,
    createEvent,
    updateEvent: updateEventFromHook,
    deleteEvent: deleteEventFromHook,
    setSelectedEvent,
    setView,
    handleEventClick: handleEventClickFromHook,
    handleEventDrop: handleEventDropFromHook,
    loadEvents,
  } = useCalendar();

  // Load calendar plugins
  useEffect(() => {
    const loadPlugins = async () => {
      const dayGridPlugin = (await import('@fullcalendar/daygrid')).default;
      const timeGridPlugin = (await import('@fullcalendar/timegrid')).default;
      const interactionPlugin = (await import('@fullcalendar/interaction')).default;
      
      setCalendarPlugins([dayGridPlugin, timeGridPlugin, interactionPlugin]);
    };
    
    loadPlugins();
  }, []);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDateSelectLocal = (selectInfo: any) => {
    setSelectedDate(new Date(selectInfo.start));
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClickLocal = (clickInfo: any) => {
    handleEventClickFromHook(clickInfo);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: CalendarEvent | Omit<CalendarEvent, 'id'>) => {
    try {
      if ('id' in eventData) {
        await updateEventFromHook(eventData.id, eventData);
      } else {
        await createEvent(eventData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEventFromHook(eventId);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar Command Center</h1>
            <p className="text-gray-600">Manage meetings, deliveries, and project milestones</p>
          </div>
          <div className="flex items-center gap-4">
            <WeatherWidget />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('dayGridMonth')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  view === 'dayGridMonth'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('timeGridWeek')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  view === 'timeGridWeek'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('timeGridDay')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  view === 'timeGridDay'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r">
          <CalendarSidebar events={events} />
        </div>

        {/* Main Calendar */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {calendarPlugins.length > 0 ? (
                <FullCalendar
                  plugins={calendarPlugins}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  initialView={view}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  events={events.map(event => ({
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    backgroundColor: event.color,
                    borderColor: event.color,
                    textColor: '#ffffff',
                    extendedProps: {
                      type: event.type,
                      project_id: event.project_id,
                      metadata: event.metadata,
                    },
                  }))}
                  select={handleDateSelectLocal}
                  eventClick={handleEventClickLocal}
                  eventDrop={handleEventDropFromHook}
                  eventResize={handleEventDropFromHook}
                  height="auto"
                  aspectRatio={1.5}
                  eventDisplay="block"
                  displayEventTime={view !== 'dayGridMonth'}
                  eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    omitZeroMinute: false,
                    meridiem: 'short',
                  }}
                />
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading calendar plugins...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? () => handleDeleteEvent(selectedEvent.id) : undefined}
      />
    </div>
  );
}