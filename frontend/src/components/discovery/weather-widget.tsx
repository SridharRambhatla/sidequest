'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSun, Sun, CloudLightning } from 'lucide-react';
import { WeatherData } from '@/lib/types';
import { fetchWeather } from '@/lib/weather';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  className?: string;
  compact?: boolean;
}

const weatherIconComponents: Record<WeatherData['condition'], React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  partly_cloudy: CloudSun,
  thunderstorm: CloudLightning,
};

export function WeatherWidget({ className, compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather()
      .then(setWeather)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = weatherIconComponents[weather.condition];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
        <WeatherIcon className="h-4 w-4" />
        <span>{weather.temperature}°</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <WeatherIcon className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{weather.temperature}°C</span>
      </div>
      <span className="text-sm text-muted-foreground hidden sm:block">
        {weather.recommendation}
      </span>
    </div>
  );
}

// Inline weather badge for cards - simplified
export function WeatherBadge({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchWeather().then(setWeather);
  }, []);

  if (!weather) return null;

  const WeatherIcon = weatherIconComponents[weather.condition];

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <WeatherIcon className="h-3.5 w-3.5" />
      {weather.temperature}°
    </span>
  );
}
