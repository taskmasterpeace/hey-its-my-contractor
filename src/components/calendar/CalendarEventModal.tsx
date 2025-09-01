'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@contractor-platform/types';
import { X, Calendar, Clock, Users, MapPin, FileText, Trash2 } from 'lucide-react';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
  onSave: (event: CalendarEvent | Omit<CalendarEvent, 'id'>) => void;
  onDelete?: () => void;
}

export function CalendarEventModal({
  isOpen,
  onClose,
  event,
  selectedDate,
  onSave,
  onDelete,
}: CalendarEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    type: 'meeting' as CalendarEvent['type'],
    project_id: '',
    color: '#2563EB',
    metadata: {
      location: '',
      client: '',
      description: '',
      participants: [] as string[],
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      // Edit mode - populate form with event data
      setFormData({
        title: event.title,
        start: new Date(event.start).toISOString().slice(0, 16),
        end: event.end ? new Date(event.end).toISOString().slice(0, 16) : '',
        type: event.type,
        project_id: event.project_id,
        color: event.color || '#2563EB',
        metadata: {
          location: event.metadata?.location || '',
          client: event.metadata?.client || '',
          description: event.metadata?.description || '',
          participants: event.metadata?.participants || [],
        },
      });
    } else if (selectedDate) {
      // Create mode - use selected date
      const dateStr = selectedDate.toISOString().slice(0, 10);
      setFormData({
        title: '',
        start: `${dateStr}T09:00`,
        end: `${dateStr}T10:00`,
        type: 'meeting',
        project_id: '',
        color: '#2563EB',
        metadata: {
          location: '',
          client: '',
          description: '',
          participants: [],
        },
      });
    }
    setErrors({});
  }, [event, selectedDate, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start) {
      newErrors.start = 'Start time is required';
    }

    if (formData.end && new Date(formData.end) <= new Date(formData.start)) {
      newErrors.end = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const eventData: CalendarEvent | Omit<CalendarEvent, 'id'> = {
      ...(event && { id: event.id }),
      title: formData.title.trim(),
      start: new Date(formData.start).toISOString(),
      end: formData.end ? new Date(formData.end).toISOString() : undefined,
      type: formData.type,
      project_id: formData.project_id || 'default-project',
      color: formData.color,
      metadata: formData.metadata,
    };

    onSave(eventData);
  };

  const eventTypeOptions = [
    { value: 'meeting', label: 'Meeting', color: '#2563EB' },
    { value: 'inspection', label: 'Inspection', color: '#059669' },
    { value: 'delivery', label: 'Delivery', color: '#F59E0B' },
    { value: 'milestone', label: 'Milestone', color: '#7C3AED' },
  ];

  const projectOptions = [
    { value: 'proj-1', label: 'Johnson Kitchen Remodel' },
    { value: 'proj-2', label: 'Wilson Bathroom' },
    { value: 'proj-3', label: 'Davis Deck Construction' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.start}
                onChange={e => setFormData(prev => ({ ...prev, start: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.start ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start && (
                <p className="mt-1 text-sm text-red-600">{errors.start}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.end}
                onChange={e => setFormData(prev => ({ ...prev, end: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.end ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end && (
                <p className="mt-1 text-sm text-red-600">{errors.end}</p>
              )}
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={formData.type}
              onChange={e => {
                const selectedType = e.target.value as CalendarEvent['type'];
                const selectedOption = eventTypeOptions.find(opt => opt.value === selectedType);
                setFormData(prev => ({
                  ...prev,
                  type: selectedType,
                  color: selectedOption?.color || '#2563EB',
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {eventTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              value={formData.project_id}
              onChange={e => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a project</option>
              {projectOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.metadata.location}
              onChange={e => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, location: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location"
            />
          </div>

          {/* Client */}
          {formData.type === 'meeting' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Client
              </label>
              <input
                type="text"
                value={formData.metadata.client}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, client: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter client name"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.metadata.description}
              onChange={e => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, description: e.target.value }
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter description or notes"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Event
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {event ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}