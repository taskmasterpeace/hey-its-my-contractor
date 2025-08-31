// OpenWeatherMap API Integration
// Provides weather data for field logging and work recommendations

export interface WeatherConfig {
  apiKey: string;
  baseUrl?: string;
  units?: 'metric' | 'imperial';
}

export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    visibility: number;
    uv_index: number;
    wind_speed: number;
    wind_direction: number;
    conditions: string;
    description: string;
    icon: string;
  };
  timestamp: string;
  work_recommendation: {
    suitability: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
    message: string;
    restrictions: string[];
    recommendations: string[];
  };
}

export interface WeatherForecast {
  location: WeatherData['location'];
  forecast: Array<{
    date: string;
    day_name: string;
    high_temp: number;
    low_temp: number;
    conditions: string;
    description: string;
    icon: string;
    precipitation_chance: number;
    wind_speed: number;
    work_recommendation: WeatherData['work_recommendation'];
  }>;
  alerts?: Array<{
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    start: string;
    end: string;
  }>;
}

export interface WorkTypeWeatherRules {
  outdoor_work: {
    min_temp: number;
    max_temp: number;
    max_wind_speed: number;
    max_precipitation: number;
    restrictions: string[];
  };
  concrete_work: {
    min_temp: number;
    max_temp: number;
    max_precipitation: number;
    cure_time_hours: number;
    restrictions: string[];
  };
  roofing: {
    min_temp: number;
    max_wind_speed: number;
    max_precipitation: number;
    restrictions: string[];
  };
  painting: {
    min_temp: number;
    max_temp: number;
    max_humidity: number;
    max_precipitation: number;
    restrictions: string[];
  };
}

export class WeatherService {
  private config: WeatherConfig;
  private workRules: WorkTypeWeatherRules;

  constructor(config: WeatherConfig) {
    this.config = {
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      units: 'imperial',
      ...config,
    };

    this.workRules = {
      outdoor_work: {
        min_temp: 40,
        max_temp: 95,
        max_wind_speed: 25,
        max_precipitation: 0.1,
        restrictions: ['Heavy rain', 'High winds', 'Extreme temperatures'],
      },
      concrete_work: {
        min_temp: 45,
        max_temp: 85,
        max_precipitation: 0,
        cure_time_hours: 24,
        restrictions: ['Rain during pour', 'Freezing temperatures', 'Extreme heat'],
      },
      roofing: {
        min_temp: 45,
        max_wind_speed: 20,
        max_precipitation: 0,
        restrictions: ['Any precipitation', 'High winds', 'Icy conditions'],
      },
      painting: {
        min_temp: 50,
        max_temp: 85,
        max_humidity: 85,
        max_precipitation: 0,
        restrictions: ['Rain', 'High humidity', 'Temperature extremes'],
      },
    };
  }

  /**
   * Get current weather for location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.config.apiKey,
      units: this.config.units || 'imperial',
    });

    const response = await this.makeRequest(`/weather?${params}`);
    return this.parseCurrentWeather(response);
  }

  /**
   * Get weather by city name
   */
  async getWeatherByCity(city: string, state?: string): Promise<WeatherData> {
    const query = state ? `${city},${state},US` : city;
    const params = new URLSearchParams({
      q: query,
      appid: this.config.apiKey,
      units: this.config.units || 'imperial',
    });

    const response = await this.makeRequest(`/weather?${params}`);
    return this.parseCurrentWeather(response);
  }

  /**
   * Get 7-day weather forecast
   */
  async getForecast(lat: number, lon: number): Promise<WeatherForecast> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      appid: this.config.apiKey,
      units: this.config.units || 'imperial',
      exclude: 'minutely,hourly',
    });

    const response = await this.makeRequest(`/onecall?${params}`, {}, 'https://api.openweathermap.org/data/3.0');
    return this.parseForecast(response);
  }

  /**
   * Get work recommendations for specific work type
   */
  getWorkRecommendation(weatherData: WeatherData, workType: keyof WorkTypeWeatherRules): {
    suitable: boolean;
    recommendation: WeatherData['work_recommendation'];
  } {
    const rules = this.workRules[workType];
    const current = weatherData.current;
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Temperature checks
    if (current.temperature < rules.min_temp) {
      issues.push(`Temperature too low (${current.temperature}°F < ${rules.min_temp}°F)`);
      recommendations.push('Wait for warmer conditions or use heated enclosure');
    }
    
    if (current.temperature > rules.max_temp) {
      issues.push(`Temperature too high (${current.temperature}°F > ${rules.max_temp}°F)`);
      recommendations.push('Work early morning or late afternoon');
    }

    // Wind checks
    if ('max_wind_speed' in rules && current.wind_speed > rules.max_wind_speed) {
      issues.push(`Wind too strong (${current.wind_speed} mph > ${rules.max_wind_speed} mph)`);
      recommendations.push('Postpone work until wind subsides');
    }

    // Humidity checks (for painting)
    if ('max_humidity' in rules && current.humidity > rules.max_humidity) {
      issues.push(`Humidity too high (${current.humidity}% > ${rules.max_humidity}%)`);
      recommendations.push('Use dehumidifiers or wait for drier conditions');
    }

    // Precipitation checks
    if (current.conditions.toLowerCase().includes('rain') || 
        current.conditions.toLowerCase().includes('snow')) {
      issues.push('Active precipitation detected');
      recommendations.push('Wait for precipitation to stop and surfaces to dry');
    }

    // Determine suitability
    let suitability: WeatherData['work_recommendation']['suitability'] = 'excellent';
    let message = `Perfect conditions for ${workType.replace('_', ' ')}.`;

    if (issues.length > 0) {
      if (issues.length === 1 && !issues[0].includes('dangerous')) {
        suitability = 'fair';
        message = `Proceed with caution for ${workType.replace('_', ' ')}.`;
      } else if (issues.length >= 2) {
        suitability = 'poor';
        message = `Not recommended for ${workType.replace('_', ' ')}.`;
      }
      
      if (issues.some(issue => issue.includes('dangerous') || issue.includes('extreme'))) {
        suitability = 'dangerous';
        message = `Dangerous conditions - do not proceed with ${workType.replace('_', ' ')}.`;
      }
    } else if (current.temperature > rules.min_temp + 10 && 
               current.temperature < rules.max_temp - 10 &&
               current.wind_speed < (rules.max_wind_speed || 30) / 2) {
      suitability = 'excellent';
      message = `Excellent conditions for ${workType.replace('_', ' ')}.`;
    } else {
      suitability = 'good';
      message = `Good conditions for ${workType.replace('_', ' ')}.`;
    }

    return {
      suitable: suitability === 'excellent' || suitability === 'good',
      recommendation: {
        suitability,
        message,
        restrictions: issues,
        recommendations,
      },
    };
  }

  /**
   * Get weather alerts for work planning
   */
  async getWeatherAlerts(lat: number, lon: number): Promise<WeatherForecast['alerts']> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        appid: this.config.apiKey,
      });

      const response = await this.makeRequest(`/onecall?${params}`, {}, 'https://api.openweathermap.org/data/3.0');
      
      return response.alerts?.map((alert: any) => ({
        title: alert.event,
        description: alert.description,
        severity: this.mapAlertSeverity(alert.severity),
        start: new Date(alert.start * 1000).toISOString(),
        end: new Date(alert.end * 1000).toISOString(),
      })) || [];
    } catch (error) {
      console.error('Failed to fetch weather alerts:', error);
      return [];
    }
  }

  /**
   * Smart scheduling recommendations based on weather forecast
   */
  async getSchedulingRecommendations(
    lat: number, 
    lon: number, 
    workType: keyof WorkTypeWeatherRules,
    durationDays: number = 7
  ): Promise<Array<{
    date: string;
    suitable: boolean;
    recommendation: string;
    weather_summary: string;
  }>> {
    const forecast = await this.getForecast(lat, lon);
    
    return forecast.forecast.slice(0, durationDays).map(day => {
      const mockWeatherData: WeatherData = {
        location: forecast.location,
        current: {
          temperature: day.high_temp,
          feels_like: day.high_temp,
          humidity: 60,
          pressure: 1013,
          visibility: 10,
          uv_index: 5,
          wind_speed: day.wind_speed,
          wind_direction: 180,
          conditions: day.conditions,
          description: day.description,
          icon: day.icon,
        },
        timestamp: day.date,
        work_recommendation: day.work_recommendation,
      };

      const workRec = this.getWorkRecommendation(mockWeatherData, workType);
      
      return {
        date: day.date,
        suitable: workRec.suitable,
        recommendation: workRec.recommendation.message,
        weather_summary: `${day.high_temp}°F/${day.low_temp}°F, ${day.conditions}, ${day.precipitation_chance}% chance of rain`,
      };
    });
  }

  /**
   * Private helper methods
   */
  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {},
    baseUrl?: string
  ): Promise<any> {
    const url = `${baseUrl || this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private parseCurrentWeather(response: any): WeatherData {
    const current = response.main;
    const weather = response.weather[0];
    const wind = response.wind;

    const weatherData: WeatherData = {
      location: {
        name: response.name,
        country: response.sys.country,
        lat: response.coord.lat,
        lon: response.coord.lon,
      },
      current: {
        temperature: Math.round(current.temp),
        feels_like: Math.round(current.feels_like),
        humidity: current.humidity,
        pressure: current.pressure,
        visibility: response.visibility ? Math.round(response.visibility / 1000) : 10,
        uv_index: 0, // Not available in current weather endpoint
        wind_speed: Math.round(wind?.speed || 0),
        wind_direction: wind?.deg || 0,
        conditions: weather.main,
        description: weather.description,
        icon: weather.icon,
      },
      timestamp: new Date().toISOString(),
      work_recommendation: {
        suitability: 'good',
        message: '',
        restrictions: [],
        recommendations: [],
      },
    };

    // Generate work recommendation for general outdoor work
    const workRec = this.getWorkRecommendation(weatherData, 'outdoor_work');
    weatherData.work_recommendation = workRec.recommendation;

    return weatherData;
  }

  private parseForecast(response: any): WeatherForecast {
    const location = {
      name: response.timezone.split('/').pop() || 'Unknown',
      country: 'US',
      lat: response.lat,
      lon: response.lon,
    };

    const forecast = response.daily.map((day: any, index: number) => {
      const date = new Date(day.dt * 1000);
      const weather = day.weather[0];
      
      return {
        date: date.toISOString().split('T')[0],
        day_name: date.toLocaleDateString('en-US', { weekday: 'long' }),
        high_temp: Math.round(day.temp.max),
        low_temp: Math.round(day.temp.min),
        conditions: weather.main,
        description: weather.description,
        icon: weather.icon,
        precipitation_chance: Math.round((day.pop || 0) * 100),
        wind_speed: Math.round(day.wind_speed || 0),
        work_recommendation: this.generateDayRecommendation(day),
      };
    });

    return {
      location,
      forecast,
      alerts: response.alerts?.map((alert: any) => ({
        title: alert.event,
        description: alert.description,
        severity: this.mapAlertSeverity(alert.severity),
        start: new Date(alert.start * 1000).toISOString(),
        end: new Date(alert.end * 1000).toISOString(),
      })) || [],
    };
  }

  private generateDayRecommendation(dayData: any): WeatherData['work_recommendation'] {
    const temp = dayData.temp.max;
    const precipitation = (dayData.pop || 0) * 100;
    const windSpeed = dayData.wind_speed || 0;
    const conditions = dayData.weather[0].main.toLowerCase();
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Temperature analysis
    if (temp < 40) {
      issues.push('Cold temperatures may affect materials');
      recommendations.push('Use cold-weather materials and techniques');
    } else if (temp > 95) {
      issues.push('Extreme heat may be dangerous for workers');
      recommendations.push('Work early morning and late afternoon only');
    }

    // Precipitation analysis
    if (precipitation > 50) {
      issues.push('High chance of rain');
      recommendations.push('Have tarps ready and plan indoor work');
    } else if (precipitation > 20) {
      recommendations.push('Monitor weather closely and have backup plans');
    }

    // Wind analysis
    if (windSpeed > 25) {
      issues.push('High wind conditions');
      recommendations.push('Avoid roofing or high work');
    }

    // Condition-specific analysis
    if (conditions.includes('storm') || conditions.includes('severe')) {
      issues.push('Severe weather expected');
      recommendations.push('Plan indoor work only');
    }

    // Determine overall suitability
    let suitability: WeatherData['work_recommendation']['suitability'] = 'excellent';
    let message = 'Perfect conditions for all types of work.';

    if (issues.length === 0 && temp >= 50 && temp <= 80 && precipitation < 10) {
      suitability = 'excellent';
      message = 'Perfect conditions for all types of work.';
    } else if (issues.length <= 1 && precipitation < 30) {
      suitability = 'good';
      message = 'Good conditions with minor considerations.';
    } else if (issues.length <= 2 && precipitation < 50) {
      suitability = 'fair';
      message = 'Fair conditions - plan accordingly.';
    } else if (issues.some(i => i.includes('severe') || i.includes('dangerous'))) {
      suitability = 'dangerous';
      message = 'Dangerous conditions - avoid outdoor work.';
    } else {
      suitability = 'poor';
      message = 'Poor conditions - consider postponing outdoor work.';
    }

    return {
      suitability,
      message,
      restrictions: issues,
      recommendations,
    };
  }

  private mapAlertSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    switch (severity?.toLowerCase()) {
      case 'minor':
        return 'minor';
      case 'moderate':
        return 'moderate';
      case 'severe':
        return 'severe';
      case 'extreme':
        return 'extreme';
      default:
        return 'moderate';
    }
  }

  /**
   * Get weather icon URL
   */
  getIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }

  /**
   * Format weather for field logs
   */
  formatForFieldLog(weatherData: WeatherData): string {
    const { current, location } = weatherData;
    return `Weather at ${location.name}: ${current.temperature}°F, ${current.conditions}, ${current.humidity}% humidity, ${current.wind_speed} mph wind. Work conditions: ${weatherData.work_recommendation.suitability}.`;
  }

  /**
   * Check if work should be rescheduled
   */
  shouldRescheduleWork(
    weatherData: WeatherData, 
    workType: keyof WorkTypeWeatherRules
  ): {
    shouldReschedule: boolean;
    reason: string;
    suggestedAction: string;
  } {
    const workRec = this.getWorkRecommendation(weatherData, workType);
    
    if (workRec.recommendation.suitability === 'dangerous' || 
        workRec.recommendation.suitability === 'poor') {
      return {
        shouldReschedule: true,
        reason: workRec.recommendation.message,
        suggestedAction: workRec.recommendation.recommendations[0] || 'Postpone until conditions improve',
      };
    }

    return {
      shouldReschedule: false,
      reason: 'Conditions are suitable for work',
      suggestedAction: 'Proceed as planned',
    };
  }
}