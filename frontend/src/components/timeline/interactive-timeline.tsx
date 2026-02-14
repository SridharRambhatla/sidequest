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
import { ExperienceItem } from '@/lib/types';
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
  onExperiencesReorder?: (experiences: ExperienceItem[]) => void;
  onExperienceClick?: (index: number) => void;
  className?: string;
}

function generateTimelineData(experiences: ExperienceItem[]): TimelineExperience[] {
  let currentMinutes = 9 * 60; // Start 9 AM

  return experiences.map((exp, index) => {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    const durationMinutes = exp.category === 'Heritage Walk' ? 180 
      : exp.category === 'Craft Workshop' ? 150
      : exp.category === 'Food & Drink' ? 60
      : 90;
    
    const durationStr = durationMinutes >= 60 
      ? `${Math.floor(durationMinutes / 60)}h`
      : `${durationMinutes}m`;

    const travelMethods: ('walk' | 'drive' | 'transit')[] = ['walk', 'drive', 'transit'];
    const travelMethod = travelMethods[index % 3];
    const distance = 1 + Math.random() * 4;
    const travelDuration = Math.round(distance * (travelMethod === 'walk' ? 12 : 4));

    currentMinutes += durationMinutes + travelDuration + 15;

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
  onExperiencesReorder,
  onExperienceClick,
  className,
}: InteractiveTimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineExperience[]>(() => 
    generateTimelineData(experiences)
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
                onExpand={() => onExperienceClick?.(index)}
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
