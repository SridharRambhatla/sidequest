'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  GripVertical,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  IndianRupee,
  Navigation,
  Sparkles,
  Lightbulb,
  CalendarDays,
  Timer,
  UserCheck,
} from 'lucide-react';
import { ExperienceItem, CulturalContext, SocialScaffolding } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DraggableTimelineCardProps {
  id: string;
  experience: ExperienceItem;
  index: number;
  timeSlot: string;
  duration: string;
  isActive?: boolean;
  culturalContext?: CulturalContext[string];
  socialScaffolding?: SocialScaffolding[string];
  onMapFocus?: () => void;
  onTimeEdit?: () => void;
  onDelete?: () => void;
}

const categoryEmojis: Record<string, string> = {
  'Food & Drink': '🍽️',
  food: '🍽️',
  'Craft Workshop': '🎨',
  craft: '🎨',
  'Heritage Walk': '🏛️',
  heritage: '🏛️',
  Fitness: '🌅',
  fitness: '🌅',
  'Art & Culture': '🎭',
  art: '🎭',
  Nature: '🌿',
  nature: '🌿',
  Nightlife: '🎵',
  music: '🎵',
  Shopping: '🛍️',
  shopping: '🛍️',
  networking: '🤝',
};

export function DraggableTimelineCard({
  id,
  experience,
  index,
  timeSlot,
  duration,
  isActive,
  culturalContext,
  socialScaffolding,
  onMapFocus,
  onTimeEdit,
  onDelete,
}: DraggableTimelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const emoji = categoryEmojis[experience.category] ?? '✨';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group', isDragging && 'z-50 opacity-90')}
    >
      <Card
        className={cn(
          'overflow-hidden border-border/50 relative transition-shadow duration-200',
          isDragging && 'shadow-lg',
          isActive && 'ring-2 ring-primary/20',
          isExpanded && 'shadow-md border-primary/20'
        )}
      >
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* ── Collapsed row ── */}
        <div className="flex items-stretch">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="w-8 flex items-center justify-center bg-muted/30 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </div>

          {/* Time column */}
          <button
            onClick={onTimeEdit}
            className="w-16 py-3 flex flex-col items-center justify-center border-r border-border/50 hover:bg-muted/30 transition-colors flex-shrink-0"
          >
            <span className="text-sm font-semibold">{timeSlot}</span>
            <span className="text-[10px] text-muted-foreground">{duration}</span>
          </button>

          {/* Main content */}
          <button
            className="flex-1 p-3 flex items-center gap-3 min-w-0 text-left"
            onClick={() => setIsExpanded((v) => !v)}
          >
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{emoji}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{experience.name}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{experience.location}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 pr-1">
              <span className="text-sm font-medium">
                ₹{experience.budget.toLocaleString('en-IN')}
              </span>
              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </div>
          </button>
        </div>

        {/* ── Expanded details panel ── */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-border/50 bg-muted/20">

            {/* Description / lore */}
            {(experience.description || experience.lore) && (
              <p className="text-sm text-muted-foreground leading-relaxed pt-2">
                {experience.description || experience.lore}
              </p>
            )}

            {experience.lore && experience.lore !== experience.description && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{experience.lore}&rdquo;
              </p>
            )}

            <Separator />

            {/* Key facts grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Fact icon={<IndianRupee className="h-3.5 w-3.5" />} label="Budget">
                ₹{experience.budget.toLocaleString('en-IN')}
              </Fact>
              {experience.duration_hours && (
                <Fact icon={<Timer className="h-3.5 w-3.5" />} label="Duration">
                  {experience.duration_hours}h
                </Fact>
              )}
              {experience.timing && (
                <Fact icon={<Clock className="h-3.5 w-3.5" />} label="Best time">
                  {experience.timing}
                </Fact>
              )}
              {experience.solo_friendly && (
                <Fact icon={<UserCheck className="h-3.5 w-3.5" />} label="Solo">
                  Solo-sure
                  {socialScaffolding?.solo_percentage && ` · ${socialScaffolding.solo_percentage}`}
                </Fact>
              )}
            </div>

            {/* Operating hours / days */}
            {(experience.operating_hours || experience.operating_days?.length) && (
              <>
                <Separator />
                <div className="flex gap-2 text-xs">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {experience.operating_hours && (
                      <p className="text-muted-foreground">{experience.operating_hours}</p>
                    )}
                    {experience.operating_days && experience.operating_days.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {experience.operating_days.map((d) => (
                          <span key={d} className="bg-muted px-2 py-0.5 rounded-full capitalize">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Cultural intel */}
            {culturalContext && (culturalContext.timing || culturalContext.tip || culturalContext.solo_note || culturalContext.transport) && (
              <>
                <Separator />
                <div className="flex gap-2 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-muted-foreground">
                    {culturalContext.timing && (
                      <p><span className="font-medium text-foreground/70">Best time: </span>{culturalContext.timing}</p>
                    )}
                    {culturalContext.tip && (
                      <p><span className="font-medium text-foreground/70">Tip: </span>{culturalContext.tip}</p>
                    )}
                    {culturalContext.transport && !culturalContext.tip && (
                      <p><span className="font-medium text-foreground/70">Getting there: </span>{culturalContext.transport}</p>
                    )}
                    {culturalContext.solo_note && (
                      <p><span className="font-medium text-foreground/70">Solo: </span>{culturalContext.solo_note}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Social vibe */}
            {socialScaffolding?.scaffolding && (
              <>
                <Separator />
                <div className="flex gap-2 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-muted-foreground">
                    <p>{socialScaffolding.scaffolding}</p>
                    {socialScaffolding.arrival_vibe && (
                      <p className="italic">&ldquo;{socialScaffolding.arrival_vibe}&rdquo;</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Map button */}
            {onMapFocus && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1"
                onClick={(e) => { e.stopPropagation(); onMapFocus(); }}
              >
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                Show on map
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-muted-foreground flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
        <p className="font-medium text-foreground/80">{children}</p>
      </div>
    </div>
  );
}
