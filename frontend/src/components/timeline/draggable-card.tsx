'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { ExperienceItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DraggableTimelineCardProps {
  id: string;
  experience: ExperienceItem;
  index: number;
  timeSlot: string;
  duration: string;
  isActive?: boolean;
  onExpand?: () => void;
  onTimeEdit?: () => void;
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

export function DraggableTimelineCard({
  id,
  experience,
  index,
  timeSlot,
  duration,
  isActive,
  onExpand,
  onTimeEdit,
}: DraggableTimelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const emoji = categoryEmojis[experience.category] || '✨';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'z-50 opacity-90'
      )}
    >
      <Card className={cn(
        'overflow-hidden border-border/50',
        'transition-shadow duration-200',
        isDragging && 'shadow-lg',
        isActive && 'ring-2 ring-primary/20'
      )}>
        <div className="flex items-stretch">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="w-8 flex items-center justify-center bg-muted/30 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </div>

          {/* Time */}
          <button
            onClick={onTimeEdit}
            className="w-16 py-3 flex flex-col items-center justify-center border-r border-border/50 hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-semibold">{timeSlot}</span>
            <span className="text-[10px] text-muted-foreground">{duration}</span>
          </button>

          {/* Content */}
          <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
            {/* Emoji */}
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{emoji}</span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {experience.name}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {experience.location}
              </p>
            </div>

            {/* Price + Expand */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium">
                ₹{experience.budget.toLocaleString('en-IN')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onExpand}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
