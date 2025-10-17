import { useCallback } from 'react';
import { CalendarEvent, Meeting } from '@contractor-platform/types';
import { useAppStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';

export function useCalendar() {
  const events = useAppStore((state) => state.calendarEvents);
  const selectedEvent = useAppStore((state) => state.selectedEvent);
  const view = useAppStore((state) => state.calendarView);
  const loading = useAppStore((state) => state.loading.calendar);
  const currentProject = useAppStore((state) => state.currentProject);
  const meetings = useAppStore((state) => state.meetings);
  const selectedMeeting = useAppStore((state) => state.selectedMeeting);

  const {
    setCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    setSelectedEvent,
    setCalendarView,
    setLoading,
    setMeetings,
    setSelectedMeeting,
  } = useAppStore();

  // Get real Supabase user ID from AuthContext
  const { user: supabaseUser } = useAuth();

  // Get current user for permission filtering (for display purposes)
  const currentUser = useAppStore((state) => state.currentUser);
  const userRole = useAppStore((state) => state.userRole);
  
  // Helper function to get client's project ID
  const getClientProjectId = (clientId: string): string => {
    const projectMapping: Record<string, string> = {
      'client-1': 'proj-1', // John Smith → Johnson Kitchen
      'client-2': 'proj-2', // Emily Wilson → Wilson Bathroom  
      'client-3': 'proj-3', // Davis → Deck Construction
    };
    return projectMapping[clientId] || '';
  };
  
  // Filter events based on user role and permissions
  const filteredEvents = events.filter(event => {
    // If project filter is active, apply it first
    if (currentProject && event.project_id !== currentProject.id) {
      return false;
    }
    
    if (!currentUser) return false;
    
    if (userRole === 'contractor' || userRole === 'staff' || userRole === 'admin') {
      // Contractors see all events in their tenant
      return true;
    } else if (userRole === 'homeowner') {
      // Homeowners only see events for their projects
      return event.metadata?.client === `${currentUser.profile.first_name} ${currentUser.profile.last_name}` ||
        event.project_id === getClientProjectId(currentUser.id);
    }
    
    return false;
  });

  // Calendar event handlers
  const handleEventClick = useCallback((clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
    }
  }, [events, setSelectedEvent]);

  const handleEventDrop = useCallback((dropInfo: any) => {
    const eventId = dropInfo.event.id;
    const updates = {
      start: dropInfo.event.start.toISOString(),
      end: dropInfo.event.end?.toISOString(),
    };
    
    updateCalendarEvent(eventId, updates);
  }, [updateCalendarEvent]);

  // API Actions
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    setLoading(true, 'calendar');
    try {
      const newEvent: CalendarEvent = {
        ...eventData,
        id: Date.now().toString(),
      };
      
      // In real app, this would call API
      // await api.createCalendarEvent(newEvent);
      
      addCalendarEvent(newEvent);
      return newEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    } finally {
      setLoading(false, 'calendar');
    }
  }, [addCalendarEvent, setLoading]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    setLoading(true, 'calendar');
    try {
      // In real app, this would call API
      // await api.updateCalendarEvent(id, updates);
      
      updateCalendarEvent(id, updates);
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    } finally {
      setLoading(false, 'calendar');
    }
  }, [updateCalendarEvent, setLoading]);

  const deleteEvent = useCallback(async (id: string) => {
    setLoading(true, 'calendar');
    try {
      // In real app, this would call API
      // await api.deleteCalendarEvent(id);
      
      deleteCalendarEvent(id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    } finally {
      setLoading(false, 'calendar');
    }
  }, [deleteCalendarEvent, setLoading]);

  const loadEvents = useCallback(async (projectId?: string) => {
    setLoading(true, 'calendar');
    try {
      if (projectId && supabaseUser) {
        // Build query params using real Supabase user ID
        const params = new URLSearchParams();
        params.append('userId', supabaseUser.id);
        params.append('status', 'completed');

        // Fetch meetings from API with filters
        const response = await fetch(`/api/project/${projectId}/meetings?${params.toString()}`);
        const result = await response.json();
        if (result.success && result.data) {
          const meetingsData: Meeting[] = result.data;
          setMeetings(meetingsData);
          // Convert meetings to calendar events
          const meetingEvents: CalendarEvent[] = meetingsData.map((meeting) => ({
            id: meeting.id,
            title: meeting.title,
            start: meeting.starts_at,
            end: meeting.ends_at || meeting.starts_at,
            type: 'meeting',
            project_id: meeting.project_id,
            meeting_id: meeting.id,
            color: '#2563EB',
            metadata: {
              status: meeting.status,
              type: meeting.type,
              tags: meeting.tags,
              hasRecording: !!meeting.recording_url,
              hasTranscript: !!(meeting as Meeting).transcript,
            },
          }));

          setCalendarEvents(meetingEvents);
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      throw error;
    } finally {
      setLoading(false, 'calendar');
    }
  }, [setCalendarEvents, setLoading, setMeetings, supabaseUser]);

  // Computed values
  const todaysEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  const upcomingEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return eventDate > now && eventDate <= weekFromNow;
  });

  return {
    // State
    events: filteredEvents,
    allEvents: events,
    selectedEvent,
    view,
    loading,
    todaysEvents,
    upcomingEvents,
    meetings,
    selectedMeeting,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    setSelectedEvent,
    setView: setCalendarView,
    // Event Handlers
    setSelectedMeeting,
    handleEventClick,
    handleEventDrop,
  };
}