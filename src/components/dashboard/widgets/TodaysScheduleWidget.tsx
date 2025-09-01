'use client';

import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';

interface TodaysScheduleWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
}

export function TodaysScheduleWidget({ onRemove, isEditMode }: TodaysScheduleWidgetProps) {
  // Mock today's events
  const todaysEvents = [
    {
      id: '1',
      title: 'Client Meeting - Progress Review',
      time: '9:00 AM',
      duration: '1 hour',
      project: 'Johnson Kitchen',
      location: '123 Main St',
      type: 'meeting',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Material Delivery - Cabinets',
      time: '11:00 AM', 
      duration: '30 minutes',
      project: 'Johnson Kitchen',
      location: '123 Main St',
      type: 'delivery',
      status: 'confirmed'
    },
    {
      id: '3',
      title: 'Electrical Inspection',
      time: '2:00 PM',
      duration: '45 minutes', 
      project: 'Wilson Bathroom',
      location: '456 Oak Ave',
      type: 'inspection',
      status: 'pending'
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'delivery': return '📦';
      case 'inspection': return '✅';
      default: return '📅';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
          <span className="text-sm text-gray-500">({todaysEvents.length} events)</span>
        </div>
        
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {todaysEvents.map((event) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getEventIcon(event.type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-600">{event.project}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {event.location}
                </div>
              </div>
              <span>{event.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weather Alert */}
      <div className="p-4 border-t bg-green-50">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">🌞</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Perfect weather today</p>
            <p className="text-xs text-green-700">72°F, clear skies - ideal for all outdoor work</p>
          </div>
        </div>
      </div>
    </div>
  );
}