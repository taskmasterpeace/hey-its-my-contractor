'use client';

import { useState, useEffect } from 'react';
import { DailyLog, WeatherData } from '@contractor-platform/types';
import { FieldLogForm } from '@/components/field/FieldLogForm';
import { WeatherDisplay } from '@/components/field/WeatherDisplay';
import { LogsList } from '@/components/field/LogsList';
import { Camera, MapPin, Cloud, Calendar, Clock } from 'lucide-react';

export default function FieldLogPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Get user's location and weather data
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        setIsLoadingWeather(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lon: longitude });
            
            // Simulate weather API call
            setTimeout(() => {
              const mockWeather: WeatherData = {
                location: {
                  name: 'Richmond',
                  country: 'US',
                  lat: latitude,
                  lon: longitude,
                },
                current: {
                  temperature: 72,
                  feels_like: 74,
                  humidity: 55,
                  pressure: 1013,
                  visibility: 10,
                  uv_index: 6,
                  wind_speed: 8,
                  wind_direction: 180,
                  conditions: 'Clear',
                  description: 'clear sky',
                  icon: '01d',
                },
                timestamp: new Date().toISOString(),
                work_recommendation: {
                  suitability: 'excellent',
                  message: 'Perfect conditions for all types of outdoor work.',
                  restrictions: [],
                  recommendations: ['Great day for concrete work', 'Ideal painting conditions'],
                },
              };
              
              setCurrentWeather(mockWeather);
              setIsLoadingWeather(false);
            }, 1000);
          },
          (error) => {
            console.error('Location access denied:', error);
            setIsLoadingWeather(false);
          }
        );
      }
    };

    getCurrentLocation();
  }, []);

  // Load existing logs
  useEffect(() => {
    const loadLogs = () => {
      const sampleLogs: DailyLog[] = [
        {
          id: '1',
          project_id: 'proj-1',
          user_id: 'contractor-1',
          date: '2025-01-24',
          notes: 'Completed electrical rough-in for kitchen. All outlets and switches installed according to plan. Ready for inspection tomorrow.',
          media: [
            {
              id: 'media-1',
              type: 'photo',
              url: 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Electrical+Work',
              filename: 'electrical-roughin-complete.jpg',
              size: 1800000,
              metadata: {
                width: 400,
                height: 300,
                timestamp: '2025-01-24T15:30:00Z',
              },
            },
            {
              id: 'media-2',
              type: 'audio',
              url: '/audio/voice-note-1.wav',
              filename: 'voice-note-progress.wav',
              size: 450000,
              metadata: {
                duration: 45,
                timestamp: '2025-01-24T15:32:00Z',
              },
            },
          ],
          weather_data: {
            temperature: 68,
            humidity: 60,
            conditions: 'Partly Cloudy',
            wind_speed: 5,
            precipitation: 0,
            timestamp: '2025-01-24T15:30:00Z',
          },
          location: {
            latitude: 37.5407,
            longitude: -77.4360,
            accuracy: 5,
          },
          created_at: '2025-01-24T15:35:00Z',
          updated_at: '2025-01-24T15:35:00Z',
        },
        {
          id: '2',
          project_id: 'proj-2',
          user_id: 'contractor-1',
          date: '2025-01-23',
          notes: 'Tile installation began in master bathroom. Progress slower than expected due to wall irregularities. Will need extra day.',
          media: [
            {
              id: 'media-3',
              type: 'photo',
              url: 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Bathroom+Tile',
              filename: 'bathroom-tile-progress.jpg',
              size: 2100000,
              metadata: {
                width: 400,
                height: 300,
                timestamp: '2025-01-23T14:20:00Z',
              },
            },
          ],
          weather_data: {
            temperature: 45,
            humidity: 75,
            conditions: 'Overcast',
            wind_speed: 12,
            precipitation: 0,
            timestamp: '2025-01-23T14:20:00Z',
          },
          location: {
            latitude: 37.5407,
            longitude: -77.4360,
            accuracy: 8,
          },
          created_at: '2025-01-23T16:45:00Z',
          updated_at: '2025-01-23T16:45:00Z',
        },
      ];
      
      setLogs(sampleLogs);
    };

    loadLogs();
  }, []);

  const handleCreateLog = async (logData: {
    project_id: string;
    notes: string;
    media: File[];
  }) => {
    const newLog: DailyLog = {
      id: Date.now().toString(),
      project_id: logData.project_id,
      user_id: 'contractor-1', // Current user
      date: new Date().toISOString().split('T')[0],
      notes: logData.notes,
      media: logData.media.map((file, index) => ({
        id: `media-${Date.now()}-${index}`,
        type: file.type.startsWith('image/') ? 'photo' : 
              file.type.startsWith('audio/') ? 'audio' : 'video',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      })),
      weather_data: currentWeather ? {
        temperature: currentWeather.current.temperature,
        humidity: currentWeather.current.humidity,
        conditions: currentWeather.current.conditions,
        wind_speed: currentWeather.current.wind_speed,
        precipitation: 0,
        timestamp: new Date().toISOString(),
      } : undefined,
      location: location ? {
        latitude: location.lat,
        longitude: location.lon,
        accuracy: 5,
      } : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLogs(prev => [newLog, ...prev]);
  };

  const projects = [
    { id: 'proj-1', name: 'Johnson Kitchen Remodel', address: '123 Main St' },
    { id: 'proj-2', name: 'Wilson Bathroom', address: '456 Oak Ave' },
    { id: 'proj-3', name: 'Davis Deck Construction', address: '789 Pine Rd' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Field Logging</h1>
        <p className="text-gray-600">
          Document daily progress with photos, voice notes, and automatic weather tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weather Display */}
        <div className="lg:col-span-1">
          <WeatherDisplay 
            weather={currentWeather}
            isLoading={isLoadingWeather}
            location={location}
          />
        </div>

        {/* Field Log Form */}
        <div className="lg:col-span-2">
          <FieldLogForm
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            onCreateLog={handleCreateLog}
            currentWeather={currentWeather}
            currentLocation={location}
          />
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Today's Activity</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Date</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Work Hours</span>
                </div>
                <span className="text-sm font-medium text-gray-900">8.5h</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Camera className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-600">Photos</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {logs.reduce((acc, log) => 
                    acc + log.media.filter(m => m.type === 'photo').length, 0
                  )}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="text-sm text-gray-600">Sites</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {new Set(logs.map(log => log.project_id)).size}
                </span>
              </div>
            </div>

            {/* Weather Summary */}
            {currentWeather && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Work Conditions</h4>
                <div className={`p-3 rounded-lg ${
                  currentWeather.work_recommendation.suitability === 'excellent' ? 'bg-green-50 border border-green-200' :
                  currentWeather.work_recommendation.suitability === 'good' ? 'bg-blue-50 border border-blue-200' :
                  currentWeather.work_recommendation.suitability === 'fair' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    currentWeather.work_recommendation.suitability === 'excellent' ? 'text-green-800' :
                    currentWeather.work_recommendation.suitability === 'good' ? 'text-blue-800' :
                    currentWeather.work_recommendation.suitability === 'fair' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {currentWeather.work_recommendation.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Field Logs</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <LogsList
          logs={logs.filter(log => !selectedProject || log.project_id === selectedProject)}
          projects={projects}
        />
      </div>
    </div>
  );
}