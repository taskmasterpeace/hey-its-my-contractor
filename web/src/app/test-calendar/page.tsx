'use client';

import { useState, useEffect } from 'react';

export default function TestCalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [FullCalendar, setFullCalendar] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Dynamic import to avoid SSR issues
    const loadCalendar = async () => {
      try {
        const FC = await import('@fullcalendar/react');
        const dayGrid = await import('@fullcalendar/daygrid');
        const timeGrid = await import('@fullcalendar/timegrid');
        const interaction = await import('@fullcalendar/interaction');
        
        setFullCalendar({
          Component: FC.default,
          dayGridPlugin: dayGrid.default,
          timeGridPlugin: timeGrid.default,
          interactionPlugin: interaction.default,
        });
      } catch (error) {
        console.error('Failed to load FullCalendar:', error);
      }
    };

    loadCalendar();
  }, []);

  const events = [
    {
      id: '1',
      title: 'Test Meeting',
      start: '2025-01-20T09:00:00',
      end: '2025-01-20T10:30:00',
      color: '#2563EB',
    },
  ];

  if (!mounted || !FullCalendar) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Calendar</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Calendar</h1>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <FullCalendar.Component
          plugins={[
            FullCalendar.dayGridPlugin,
            FullCalendar.timeGridPlugin,
            FullCalendar.interactionPlugin,
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          events={events}
          height="auto"
          aspectRatio={1.5}
        />
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>FullCalendar loaded: {FullCalendar ? 'Yes' : 'No'}</p>
        <p>Events count: {events.length}</p>
        <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}