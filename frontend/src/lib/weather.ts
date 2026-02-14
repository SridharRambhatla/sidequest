/**
 * Weather API Integration
 * Uses OpenWeatherMap API for real-time weather data
 */

import { WeatherData } from './types';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BANGALORE_COORDS = { lat: 12.9716, lon: 77.5946 };

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
}

function mapWeatherCondition(
  main: string
): 'sunny' | 'cloudy' | 'rainy' | 'partly_cloudy' | 'thunderstorm' {
  const condition = main.toLowerCase();
  if (condition === 'clear') return 'sunny';
  if (condition === 'clouds') return 'cloudy';
  if (condition === 'rain' || condition === 'drizzle') return 'rainy';
  if (condition === 'thunderstorm') return 'thunderstorm';
  return 'partly_cloudy';
}

function getWeatherRecommendation(condition: string, temp: number): string {
  if (condition === 'sunny' && temp >= 20 && temp <= 30) {
    return 'Perfect day for outdoor experiences!';
  }
  if (condition === 'sunny' && temp > 30) {
    return 'Hot day - consider indoor activities or early morning outings.';
  }
  if (condition === 'rainy') {
    return 'Rainy vibes - great for cozy cafes and indoor workshops.';
  }
  if (condition === 'cloudy') {
    return 'Pleasant cloudy day - ideal for walking tours and outdoor markets.';
  }
  if (condition === 'thunderstorm') {
    return 'Stormy weather - best to stay indoors. Perfect for coffee shops!';
  }
  return 'Good conditions for exploring the city.';
}

export async function fetchWeather(): Promise<WeatherData> {
  // If no API key, return mock data
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeather API key not set, using mock weather data');
    return getMockWeather();
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${BANGALORE_COORDS.lat}&lon=${BANGALORE_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data: OpenWeatherResponse = await response.json();
    const condition = mapWeatherCondition(data.weather[0].main);

    return {
      temperature: Math.round(data.main.temp),
      condition,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      recommendation: getWeatherRecommendation(condition, data.main.temp),
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return getMockWeather();
  }
}

function getMockWeather(): WeatherData {
  // Realistic Bangalore weather based on season
  const hour = new Date().getHours();
  const month = new Date().getMonth();

  // Feb is pleasant in Bangalore
  let temp = 26;
  let condition: WeatherData['condition'] = 'sunny';

  if (hour < 8) {
    temp = 19;
    condition = 'partly_cloudy';
  } else if (hour > 18) {
    temp = 22;
    condition = 'partly_cloudy';
  } else if (month >= 5 && month <= 9) {
    // Monsoon season
    temp = 24;
    condition = 'cloudy';
  }

  return {
    temperature: temp,
    condition,
    humidity: 55,
    description: condition === 'sunny' ? 'Clear sky' : 'Partly cloudy',
    icon: condition === 'sunny' ? '01d' : '02d',
    recommendation: getWeatherRecommendation(condition, temp),
  };
}

// Weather icon mapping for display
export const weatherIcons: Record<WeatherData['condition'], string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  partly_cloudy: '⛅',
  thunderstorm: '⛈️',
};

// Weather suitability check for experiences
export function isWeatherSuitable(
  weather: WeatherData,
  experience: { indoor: boolean; outdoor: boolean }
): 'perfect' | 'good' | 'fair' | 'poor' {
  if (experience.indoor) {
    return 'perfect'; // Indoor always works
  }

  if (weather.condition === 'sunny' && weather.temperature <= 32) {
    return 'perfect';
  }

  if (weather.condition === 'partly_cloudy' || weather.condition === 'cloudy') {
    return 'good';
  }

  if (weather.condition === 'rainy' && experience.outdoor) {
    return 'poor';
  }

  if (weather.condition === 'thunderstorm') {
    return experience.indoor ? 'perfect' : 'poor';
  }

  return 'fair';
}
