'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';

interface WeatherData {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  recommendation: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate weather API call - replace with OpenWeatherMap integration
    const fetchWeather = async () => {
      try {
        // Mock data for development
        const mockWeather: WeatherData = {
          temperature: 72,
          conditions: 'Clear',
          humidity: 55,
          windSpeed: 8,
          recommendation: 'Perfect for outdoor work',
        };
        
        setTimeout(() => {
          setWeather(mockWeather);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (conditions: string) => {
    switch (conditions.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-5 h-5" />;
      case 'cloudy':
      case 'overcast':
        return <Cloud className="w-5 h-5" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-5 h-5" />;
      case 'snow':
        return <Cloud className="w-5 h-5" />;
      case 'windy':
        return <Wind className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('Perfect') || recommendation.includes('Good')) {
      return 'text-green-700 bg-green-100';
    }
    if (recommendation.includes('Caution') || recommendation.includes('Consider')) {
      return 'text-yellow-700 bg-yellow-100';
    }
    if (recommendation.includes('Avoid') || recommendation.includes('Postpone')) {
      return 'text-red-700 bg-red-100';
    }
    return 'text-blue-700 bg-blue-100';
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">Loading weather...</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
        <Cloud className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500">Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 cursor-pointer">
        <div className="text-blue-600">
          {getWeatherIcon(weather.conditions)}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-blue-900">
              {weather.temperature}°F
            </span>
            <span className="text-sm text-blue-700">{weather.conditions}</span>
          </div>
        </div>
      </div>

      {/* Weather Details Tooltip */}
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
        <h3 className="font-semibold text-gray-900 mb-3">Weather Details</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-sm text-gray-600">Temperature</p>
            <p className="font-medium">{weather.temperature}°F</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Conditions</p>
            <p className="font-medium">{weather.conditions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Humidity</p>
            <p className="font-medium">{weather.humidity}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Wind Speed</p>
            <p className="font-medium">{weather.windSpeed} mph</p>
          </div>
        </div>

        <div className={`px-3 py-2 rounded-lg ${getRecommendationColor(weather.recommendation)}`}>
          <p className="text-sm font-medium">Work Recommendation</p>
          <p className="text-sm">{weather.recommendation}</p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Updates every hour • Powered by OpenWeatherMap
          </p>
        </div>
      </div>
    </div>
  );
}