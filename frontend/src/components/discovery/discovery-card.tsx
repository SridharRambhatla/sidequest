'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  MapPin,
  IndianRupee,
  Bookmark,
  Star,
  ChevronRight,
} from 'lucide-react';
import { DiscoveryExperience } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DiscoveryCardProps {
  experience: DiscoveryExperience;
  onSelect?: () => void;
  onBookmark?: (id: string) => void;
  className?: string;
}

const categoryEmojis: Record<string, string> = {
  'Food & Drink': '🍽️',
  'Craft Workshop': '🎨',
  'Heritage Walk': '🏛️',
  'Fitness': '🌅',
  'Art & Culture': '🎭',
  'Nature': '🌿',
  'Nightlife': '🎵',
  'Shopping': '🛍️',
};

export function DiscoveryCard({
  experience,
  onSelect,
  onBookmark,
  className,
}: DiscoveryCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(experience.bookmarked);
  const emoji = categoryEmojis[experience.category] || '✨';

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(experience.id);
  };

  const priceDisplay = experience.budget.min === 0 
    ? 'Free'
    : experience.budget.min === experience.budget.max 
      ? `₹${experience.budget.min}`
      : `₹${experience.budget.min}–${experience.budget.max}`;

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden',
        'bg-card border-border/40',
        'transition-all duration-200 ease-out',
        'hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {experience.image_url ? (
          <Image
            src={experience.image_url}
            alt={experience.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-40 group-hover:opacity-60 transition-opacity">
              {emoji}
            </span>
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Bookmark */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-2 right-2 h-8 w-8 rounded-full',
            'bg-white/90 hover:bg-white shadow-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity'
          )}
          onClick={handleBookmark}
        >
          <Bookmark
            className={cn(
              'h-4 w-4',
              isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
            )}
          />
        </Button>

        {/* Subtle status indicator */}
        {experience.availability.urgency_level === 'high' && (
          <span className="absolute top-2 left-2 text-xs bg-accent/90 text-white px-2 py-0.5 rounded-full">
            Limited spots
          </span>
        )}
      </div>

      <CardContent className="p-4">
        {/* Category + Solo badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            {experience.category}
          </span>
          {experience.solo_friendly.is_solo_sure && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-xs text-secondary font-medium">
                Solo-friendly
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {experience.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {experience.description_short}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {experience.location.neighborhood}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {experience.timing.duration_hours}h
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="font-semibold text-foreground">
            {priceDisplay}
          </span>
          
          {experience.rating && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {experience.rating}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
export function DiscoveryCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <CardContent className="p-4">
        <div className="h-3 w-20 skeleton rounded mb-2" />
        <div className="h-5 w-3/4 skeleton rounded mb-2" />
        <div className="h-4 w-full skeleton rounded mb-1" />
        <div className="h-4 w-2/3 skeleton rounded mb-3" />
        <div className="flex gap-3 mb-3">
          <div className="h-4 w-24 skeleton rounded" />
          <div className="h-4 w-12 skeleton rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <div className="h-5 w-16 skeleton rounded" />
          <div className="h-5 w-12 skeleton rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
