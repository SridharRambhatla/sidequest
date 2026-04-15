'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchCities } from '@/lib/api';
import { City } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (cityId: string) => void;
  className?: string;
}

export function CitySelector({
  selectedCity,
  onCityChange,
  className,
}: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCities() {
      try {
        setLoading(true);
        const fetchedCities = await fetchCities();
        setCities(fetchedCities);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError('Failed to load cities');
      } finally {
        setLoading(false);
      }
    }

    loadCities();
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <MapPin className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  const selectedCityData = cities.find((city) => city.id === selectedCity);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedCity} onValueChange={onCityChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a city">
            {selectedCityData && (
              <span className="flex items-center gap-2">
                <span>{selectedCityData.display_name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedCityData.country}
                </span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              <div className="flex flex-col">
                <span className="font-medium">{city.display_name}</span>
                <span className="text-xs text-muted-foreground">
                  {city.country}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
