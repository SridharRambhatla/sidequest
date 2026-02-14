'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MapPin, 
  IndianRupee, 
  UserCheck, 
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { ExperienceItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExperienceCardProps {
  experience: ExperienceItem;
  onSelect?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  showActions?: boolean;
  className?: string;
}

export function ExperienceCard({
  experience,
  onSelect,
  onBookmark,
  isBookmarked = false,
  showActions = true,
  className,
}: ExperienceCardProps) {
  const categoryColors: Record<string, string> = {
    'Food & Drink': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'Craft Workshop': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Heritage Walk': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Fitness': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Art & Culture': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    'Nature': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Nightlife': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'Shopping': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  };

  return (
    <Card 
      className={cn(
        'group cursor-pointer card-hover overflow-hidden',
        'border border-border/50 bg-card',
        className
      )}
      onClick={onSelect}
    >
      {/* Image placeholder - in production would use actual images */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl opacity-30">
            {experience.category === 'Food & Drink' && '🍽️'}
            {experience.category === 'Craft Workshop' && '🎨'}
            {experience.category === 'Heritage Walk' && '🏛️'}
            {experience.category === 'Fitness' && '💪'}
            {experience.category === 'Art & Culture' && '🎭'}
            {experience.category === 'Nature' && '🌿'}
            {experience.category === 'Nightlife' && '🎵'}
            {experience.category === 'Shopping' && '🛍️'}
          </span>
        </div>
        
        {/* Category badge */}
        <Badge 
          className={cn(
            'absolute top-3 left-3 font-medium',
            categoryColors[experience.category] || 'bg-muted text-muted-foreground'
          )}
        >
          {experience.category}
        </Badge>

        {/* Bookmark button */}
        {showActions && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-3 right-3 h-8 w-8 rounded-full',
              'bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.();
            }}
          >
            <Bookmark 
              className={cn(
                'h-4 w-4',
                isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
              )} 
            />
          </Button>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {experience.name}
        </h3>

        {/* Lore/Description preview */}
        {experience.lore && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {experience.lore}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {/* Timing */}
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{experience.timing}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{experience.location}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
        {/* Budget */}
        <div className="flex items-center gap-1 font-medium text-foreground">
          <IndianRupee className="h-4 w-4" />
          <span>{experience.budget.toLocaleString('en-IN')}</span>
        </div>

        {/* Solo-friendly indicator */}
        {experience.solo_friendly && (
          <Badge 
            variant="secondary" 
            className="bg-secondary/20 text-secondary-foreground border-secondary/30"
          >
            <UserCheck className="h-3 w-3 mr-1" />
            Solo-sure
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}

// Skeleton version for loading states
export function ExperienceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-40 skeleton" />
      <CardContent className="p-4">
        <div className="h-6 w-3/4 skeleton rounded mb-2" />
        <div className="h-4 w-full skeleton rounded mb-1" />
        <div className="h-4 w-2/3 skeleton rounded mb-3" />
        <div className="flex gap-3">
          <div className="h-4 w-20 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 flex justify-between">
        <div className="h-5 w-16 skeleton rounded" />
        <div className="h-5 w-20 skeleton rounded" />
      </CardFooter>
    </Card>
  );
}
