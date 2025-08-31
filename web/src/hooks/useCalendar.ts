import { useCallback } from 'react';
import { CalendarEvent } from '@contractor-platform/types';
import { useAppStore } from '@/store';

export function useCalendar() {
  const events = useAppStore((state) => state.calendarEvents);
  const selectedEvent = useAppStore((state) => state.selectedEvent);
  const view = useAppStore((state) => state.calendarView);
  const loading = useAppStore((state) => state.loading.calendar);
  const currentProject = useAppStore((state) => state.currentProject);
  
  const {
    setCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    setSelectedEvent,
    setCalendarView,
    setLoading,
  } = useAppStore();

  // Get current user for permission filtering
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

  const handleDateSelect = useCallback((selectInfo: any) => {
    // Create new event with selected date
    const newEvent: Omit<CalendarEvent, 'id'> = {
      title: '',
      start: selectInfo.start.toISOString(),
      end: selectInfo.end?.toISOString(),
      type: 'meeting',
      project_id: currentProject?.id || 'default-project',
      color: '#2563EB',
      metadata: {},
    };
    
    // This would typically open a modal with pre-filled date
    setSelectedEvent(null);
    // Modal opening logic would be handled by the component
  }, [currentProject, setSelectedEvent]);

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
    setLoading(true);
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
      setLoading(false);
    }
  }, [addCalendarEvent, setLoading]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    setLoading(true);
    try {
      // In real app, this would call API
      // await api.updateCalendarEvent(id, updates);
      
      updateCalendarEvent(id, updates);
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateCalendarEvent, setLoading]);

  const deleteEvent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // In real app, this would call API
      // await api.deleteCalendarEvent(id);
      
      deleteCalendarEvent(id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteCalendarEvent, setLoading]);

  const loadEvents = useCallback(async (projectId?: string) => {
    setLoading(true);
    try {
      // In real app, this would fetch from API
      // const events = await api.getCalendarEvents(projectId);
      
      // For now, use sample data
      const sampleEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Client Meeting - Johnson Kitchen',
          start: '2025-01-20T09:00:00',
          end: '2025-01-20T10:30:00',
          type: 'meeting',
          project_id: 'proj-1',
          meeting_id: 'meet-1',
          color: '#2563EB',
          metadata: {
            client: 'John Smith',
            status: 'confirmed',
            location: '123 Main St',
          },
        },
        {
          id: '2',
          title: 'Site Inspection - Bathroom',
          start: '2025-01-20T14:00:00',
          end: '2025-01-20T15:00:00',
          type: 'inspection',
          project_id: 'proj-2',
          color: '#059669',
          metadata: {
            inspector: 'City Inspector',
            type: 'Plumbing',
          },
        },
        // Add more sample events...
      ];
      
      setCalendarEvents(sampleEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setCalendarEvents, setLoading]);

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
    
    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    setSelectedEvent,
    setView: setCalendarView,
    
    // Event Handlers
    handleEventClick,
    handleDateSelect,
    handleEventDrop,
  };
}