'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { DraggableTimelineCard } from './draggable-card';
import { TravelIndicator } from './travel-indicator';
import { ExperienceItem, CulturalContext, SocialScaffolding } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimelineExperience extends ExperienceItem {
  id: string;
  timeSlot: string;
  durationStr: string;
  travelFromPrevious?: {
    method: 'walk' | 'drive' | 'transit' | 'ride' | 'bike';
    distance: number;
    duration: number;
  };
}

interface InteractiveTimelineProps {
  experiences: ExperienceItem[];
  culturalContext?: CulturalContext;
  socialScaffolding?: SocialScaffolding;
  dayStartTime?: string; // HH:MM default "06:00"
  onExperiencesReorder?: (experiences: ExperienceItem[]) => void;
  onExperienceClick?: (index: number) => void;
  className?: string;
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function generateTimelineData(experiences: ExperienceItem[], dayStartTime = '06:00'): TimelineExperience[] {
  let currentMinutes = parseMinutes(dayStartTime);

  return experiences.map((exp, index) => {
    // Use backend-provided start_time if available, otherwise cascade from previous
    if (exp.start_time) {
      const parsed = parseMinutes(exp.start_time);
      if (parsed >= currentMinutes) currentMinutes = parsed;
    }

    const timeSlot = minutesToHHMM(currentMinutes);

    const durationMinutes = exp.duration_hours
      ? Math.round(exp.duration_hours * 60)
      : exp.category === 'heritage' || exp.category === 'Heritage Walk' ? 180
      : exp.category === 'craft' || exp.category === 'Craft Workshop' ? 150
      : exp.category === 'food' || exp.category === 'Food & Drink' ? 60
      : 90;

    const durationStr = durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? (durationMinutes % 60) + 'm' : ''}`
      : `${durationMinutes}m`;

    const travelMethods: ('walk' | 'drive' | 'transit')[] = ['walk', 'drive', 'transit'];
    const travelMethod = travelMethods[index % 3];
    const distance = 1 + (index * 1.3) % 4;
    const travelDuration = Math.round(distance * (travelMethod === 'walk' ? 12 : 4));

    currentMinutes += durationMinutes + travelDuration + 5;

    return {
      ...exp,
      id: `exp-${index}`,
      timeSlot,
      durationStr,
      travelFromPrevious: index > 0 ? {
        method: travelMethod,
        distance: parseFloat(distance.toFixed(1)),
        duration: travelDuration,
      } : undefined,
    };
  });
}

export function InteractiveTimeline({
  experiences,
  culturalContext,
  socialScaffolding,
  dayStartTime = '06:00',
  onExperiencesReorder,
  onExperienceClick,
  className,
}: InteractiveTimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineExperience[]>(() =>
    generateTimelineData(experiences, dayStartTime)
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Calculate new order outside of setState to avoid calling parent setState during render
      const oldIndex = timelineData.findIndex((item) => item.id === active.id);
      const newIndex = timelineData.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(timelineData, oldIndex, newIndex);
      
      // Recalculate times
      let currentMinutes = 9 * 60;
      const updatedItems = newItems.map((item) => {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        const durationMinutes = parseInt(item.durationStr) * (item.durationStr.includes('h') ? 60 : 1);
        currentMinutes += durationMinutes + (item.travelFromPrevious?.duration || 15) + 15;
        
        return { ...item, timeSlot };
      });

      // Update local state
      setTimelineData(updatedItems);
      
      // Notify parent after state update (use setTimeout to defer to next tick)
      setTimeout(() => {
        toast.success('Timeline updated');
        onExperiencesReorder?.(updatedItems.map(({ id, timeSlot, durationStr, travelFromPrevious, ...rest }) => rest));
      }, 0);
    }
  }, [timelineData, onExperiencesReorder]);

  const handleDelete = useCallback((itemId: string) => {
    // Filter out the deleted item
    const newItems = timelineData.filter((item) => item.id !== itemId);
    
    if (newItems.length === 0) {
      toast.error('Cannot remove the last experience');
      return;
    }
    
    // Recalculate times for remaining items
    let currentMinutes = 9 * 60;
    const updatedItems = newItems.map((item, index) => {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      const durationMinutes = parseInt(item.durationStr) * (item.durationStr.includes('h') ? 60 : 1);
      currentMinutes += durationMinutes + (item.travelFromPrevious?.duration || 15) + 15;
      
      // Remove travel indicator from first item
      return { 
        ...item, 
        timeSlot,
        travelFromPrevious: index === 0 ? undefined : item.travelFromPrevious,
      };
    });

    // Update local state
    setTimelineData(updatedItems);
    
    // Notify parent after state update
    setTimeout(() => {
      toast.success('Experience removed');
      onExperiencesReorder?.(updatedItems.map(({ id, timeSlot, durationStr, travelFromPrevious, ...rest }) => rest));
    }, 0);
  }, [timelineData, onExperiencesReorder]);

  const activeItem = useMemo(
    () => timelineData.find((item) => item.id === activeId),
    [activeId, timelineData]
  );

  return (
    <div className={cn('space-y-0', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={timelineData.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {timelineData.map((item, index) => (
            <div key={item.id}>
              {item.travelFromPrevious && (
                <TravelIndicator
                  method={item.travelFromPrevious.method}
                  distance={item.travelFromPrevious.distance}
                  duration={item.travelFromPrevious.duration}
                />
              )}
              <DraggableTimelineCard
                id={item.id}
                experience={item}
                index={index}
                timeSlot={item.timeSlot}
                duration={item.durationStr}
                isActive={activeId === item.id}
                culturalContext={culturalContext?.[item.name]}
                socialScaffolding={socialScaffolding?.[item.name]}
                onMapFocus={() => onExperienceClick?.(index)}
                onTimeEdit={() => toast.info('Time picker coming soon')}
                onDelete={() => handleDelete(item.id)}
              />
            </div>
          ))}
        </SortableContext>

        <DragOverlay>
          {activeItem && (
            <Card className="shadow-lg opacity-95 border-primary/20">
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-xl">
                  {activeItem.category === 'Food & Drink' ? '🍽️' : '✨'}
                </span>
                <div>
                  <p className="font-medium text-sm">{activeItem.name}</p>
                  <p className="text-xs text-muted-foreground">{activeItem.timeSlot}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
