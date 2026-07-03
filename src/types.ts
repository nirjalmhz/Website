/**
 * Shared Type Definitions for Modern Weather Dashboard
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UserPreferences {
  tempUnit: 'C' | 'F';
  windUnit: 'kmh' | 'mph' | 'ms';
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
}

export interface FavoriteCity {
  id: string; // id is "lat,lon" or unique string
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  addedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  searchedAt: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  dewPoint: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
  localTime: string;
  conditionCode: number;
  timezone: string;
  isDay: boolean;
}

export interface HourlyForecastItem {
  time: string; // ISO string or short time e.g., "10:00"
  temp: number;
  precipProb: number;
  conditionCode: number;
  windSpeed: number;
  humidity: number;
}

export interface DailyForecastItem {
  date: string; // ISO string or name e.g., "Mon"
  maxTemp: number;
  minTemp: number;
  conditionCode: number;
  precipProb: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

export interface AirQuality {
  aqi: number; // Index value e.g., European AQI (1-5 or 0-100+) or US AQI
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  rating: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor' | 'Extreme';
  colorClass: string;
  recommendation: string;
}

export interface LocationData {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  timezone: string;
  population?: number;
}

export interface WeatherData {
  location: LocationData;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  airQuality: AirQuality;
}

export interface WeatherAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  createdAt: string;
}
