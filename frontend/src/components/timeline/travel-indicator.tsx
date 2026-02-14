'use client';

import { cn } from '@/lib/utils';
import { Car, Footprints, Bus, Bike } from 'lucide-react';

interface TravelIndicatorProps {
  method: 'walk' | 'drive' | 'transit' | 'ride' | 'bike';
  distance: number;
  duration: number;
  className?: string;
}

const methodIcons = {
  walk: Footprints,
  drive: Car,
  transit: Bus,
  ride: Car,
  bike: Bike,
};

export function TravelIndicator({
  method,
  distance,
  duration,
  className,
}: TravelIndicatorProps) {
  const Icon = methodIcons[method];

  return (
    <div className={cn('flex items-center gap-2 py-1.5 pl-12', className)}>
      <div className="w-8 flex justify-center">
        <div className="h-6 w-px bg-border relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
            <Icon className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">
        {distance.toFixed(1)} km · {duration} min
      </span>
    </div>
  );
}

export function TimelineConnector({ className }: { className?: string }) {
  return (
    <div className={cn('flex py-1 pl-12', className)}>
      <div className="w-8 flex justify-center">
        <div className="h-3 w-px bg-border" />
      </div>
    </div>
  );
}
