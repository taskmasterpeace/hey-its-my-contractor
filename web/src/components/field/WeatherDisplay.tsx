'use client';

import { WeatherData } from '@contractor-platform/types';
import { Cloud, Sun, CloudRain, Wind, MapPin, Thermometer } from 'lucide-react';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  isLoading: boolean;
  location: { lat: number; lon: number } | null;
}

export function WeatherDisplay({ weather, isLoading, location }: WeatherDisplayProps) {
  const getWeatherIcon = (conditions: string) => {
    switch (conditions?.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloudy':
      case 'overcast':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snow':
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'windy':
        return <Wind className="w-8 h-8 text-gray-600" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dangerous':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-center h-16 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">Weather Unavailable</h3>
        <p className="text-gray-600 text-sm">
          Unable to load weather data. Location services may be disabled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Current Conditions */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          {getWeatherIcon(weather.current.conditions)}
        </div>
        
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">
            {weather.current.temperature}°F
          </h2>
          <p className="text-lg text-gray-600 capitalize">
            {weather.current.conditions}
          </p>
          <p className="text-sm text-gray-500">
            Feels like {weather.current.feels_like}°F
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center justify-center text-sm text-gray-600">
        <MapPin className="w-4 h-4 mr-1" />
        <span>{weather.location.name}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600 mb-1">Humidity</div>
          <div className="font-semibold text-gray-900">{weather.current.humidity}%</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600 mb-1">Wind</div>
          <div className="font-semibold text-gray-900">{weather.current.wind_speed} mph</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600 mb-1">Visibility</div>
          <div className="font-semibold text-gray-900">{weather.current.visibility} mi</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-600 mb-1">UV Index</div>
          <div className="font-semibold text-gray-900">{weather.current.uv_index}</div>
        </div>
      </div>

      {/* Work Recommendation */}
      <div className={`p-4 rounded-lg border ${getSuitabilityColor(weather.work_recommendation.suitability)}`}>
        <h4 className="font-semibold mb-2">Work Conditions</h4>
        <p className="text-sm mb-2">{weather.work_recommendation.message}</p>
        
        {weather.work_recommendation.recommendations.length > 0 && (
          <div className="text-sm">
            <strong>Recommendations:</strong>
            <ul className="mt-1 space-y-1">
              {weather.work_recommendation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {weather.work_recommendation.restrictions.length > 0 && (
          <div className="text-sm mt-2">
            <strong>Restrictions:</strong>
            <ul className="mt-1 space-y-1">
              {weather.work_recommendation.restrictions.map((restriction, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-1">⚠</span>
                  <span>{restriction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Updated {new Date(weather.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}