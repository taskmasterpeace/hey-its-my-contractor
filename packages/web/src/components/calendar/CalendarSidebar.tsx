'use client';

import { CalendarEvent } from '@contractor-platform/types';
import { Calendar, Clock, MapPin, Users, FileText, Wrench } from 'lucide-react';
import { useAppStore } from '@/store';

interface CalendarSidebarProps {
  events: CalendarEvent[];
}

export function CalendarSidebar({ events }: CalendarSidebarProps) {
  const meetings = useAppStore((state) => state.meetings);
  const setSelectedMeeting = useAppStore((state) => state.setSelectedMeeting);
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  const todaysEvents = events.filter(event => 
    event.start.startsWith(todayString)
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return eventDate >= tomorrow && eventDate <= weekFromNow;
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'inspection':
        return <FileText className="w-4 h-4" />;
      case 'delivery':
        return <MapPin className="w-4 h-4" />;
      case 'milestone':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEventClick = (event: CalendarEvent) => {
    // If it's a meeting event, find and open the meeting in MediaPlayer
    if (event.type === 'meeting' && event.meeting_id) {
      const meeting = meetings.find(m => m.id === event.meeting_id);
      if (meeting) {
        setSelectedMeeting(meeting);
      }
    }
  };

  const eventTypeColors = {
    meeting: 'bg-blue-100 text-blue-800 border-blue-200',
    inspection: 'bg-green-100 text-green-800 border-green-200',
    delivery: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    milestone: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Quick Actions */}
      <div className="p-4 md:p-6 border-b">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <button
            className="w-full flex items-center px-3 py-2 text-left text-xs md:text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            onClick={() => {
              // Create new meeting for tomorrow at 9 AM
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              
              // Trigger calendar date selection
              const event = new CustomEvent('fieldtime-create-meeting', {
                detail: { date: tomorrow, type: 'meeting' }
              });
              window.dispatchEvent(event);
            }}
          >
            <Users className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Schedule Meeting
          </button>
          <button
            className="w-full flex items-center px-3 py-2 text-left text-xs md:text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            onClick={() => {
              // Navigate to field log page
              window.location.href = '/field-log?action=inspection';
            }}
          >
            <FileText className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Log Inspection
          </button>
          <button
            className="w-full flex items-center px-3 py-2 text-left text-xs md:text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            onClick={() => {
              // Create delivery event
              const event = new CustomEvent('fieldtime-create-delivery', {
                detail: { type: 'delivery' }
              });
              window.dispatchEvent(event);
            }}
          >
            <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Track Delivery
          </button>
          <button
            className="w-full flex items-center px-3 py-2 text-left text-xs md:text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            onClick={() => {
              // Create milestone event  
              const event = new CustomEvent('fieldtime-create-milestone', {
                detail: { type: 'milestone' }
              });
              window.dispatchEvent(event);
            }}
          >
            <Wrench className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Today's Events */}
      <div className="p-4 md:p-6 border-b flex-1 overflow-y-auto">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Today&apos;s Schedule</h2>
        {todaysEvents.length === 0 ? (
          <div className="text-center py-6 md:py-8">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-gray-500">No events scheduled for today</p>
          </div>
        ) : (
          <div className="h-[375px] overflow-y-auto space-y-2 md:space-y-3">
            {todaysEvents.map(event => (
              <div
                key={event.id}
                className="bg-white border rounded-lg p-2 md:p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-start justify-between mb-1 md:mb-2">
                  <div className="flex items-center">
                    <div className="text-gray-600 mr-2">
                      {getEventIcon(event.type)}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${eventTypeColors[event.type as keyof typeof eventTypeColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                      {event.type}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(event.start)}
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 text-xs md:text-sm mb-1">
                  {event.title}
                </h3>
                {event.metadata?.location && (
                  <p className="text-xs text-gray-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {event.metadata.location}
                  </p>
                )}
                {event.metadata?.client && (
                  <p className="text-xs text-gray-600">
                    Client: {event.metadata.client}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">This Week</h2>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-3 md:py-4">
            <p className="text-xs md:text-sm text-gray-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div className="text-gray-600 mr-2 flex-shrink-0">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(event.start)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {upcomingEvents.length > 5 && (
              <div className="text-center pt-2">
                <button className="text-xs md:text-sm text-blue-600 hover:text-blue-700">
                  View {upcomingEvents.length - 5} more events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}