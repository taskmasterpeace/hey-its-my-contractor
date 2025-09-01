'use client';

import { DailyLog } from '@contractor-platform/types';
import { Calendar, MapPin, Camera, Mic, Cloud, User, Eye, Sun, CloudRain } from 'lucide-react';

interface LogsListProps {
  logs: DailyLog[];
  projects: Array<{ id: string; name: string; address: string }>;
}

export function LogsList({ logs, projects }: LogsListProps) {
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="w-4 h-4 text-green-600" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-purple-600" />;
      case 'video':
        return <Eye className="w-4 h-4 text-blue-600" />;
      default:
        return <Camera className="w-4 h-4 text-gray-600" />;
    }
  };

  const getWeatherIcon = (conditions: string) => {
    switch (conditions?.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'cloudy':
      case 'overcast':
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      default:
        return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No field logs yet</h3>
        <p className="text-gray-600">Start documenting your daily progress to see logs here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {getProjectName(log.project_id)}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(log.date)}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Logged by Mike Johnson
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatTime(log.created_at)}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed">{log.notes}</p>
          </div>

          {/* Media */}
          {log.media.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Attachments ({log.media.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {log.media.map((mediaItem) => (
                  <div key={mediaItem.id} className="relative group">
                    {mediaItem.type === 'photo' ? (
                      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(mediaItem.url, '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-gray-400 transition-colors cursor-pointer">
                        {getMediaIcon(mediaItem.type)}
                        <div className="ml-2 text-xs text-gray-600">
                          {mediaItem.type}
                        </div>
                      </div>
                    )}
                    
                    {/* Media Info Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-end opacity-0 group-hover:opacity-100">
                      <div className="text-white text-xs p-2 w-full">
                        <div className="font-medium truncate">{mediaItem.filename}</div>
                        <div className="text-gray-300">
                          {Math.round(mediaItem.size / 1024)} KB
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather & Location Info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {/* Weather */}
              {log.weather_data && (
                <div className="flex items-center">
                  {getWeatherIcon(log.weather_data.conditions)}
                  <span className="ml-2">
                    {log.weather_data.temperature}°F, {log.weather_data.conditions}
                  </span>
                </div>
              )}

              {/* Location */}
              {log.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>
                    {log.location.latitude.toFixed(4)}, {log.location.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm transition-colors">
                Edit
              </button>
              <button className="px-3 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}