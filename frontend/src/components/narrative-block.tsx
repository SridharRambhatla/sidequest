'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  MapPin,
  IndianRupee,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Navigation,
  Info,
  Sparkles,
  CalendarDays,
  Timer,
  Lightbulb,
} from 'lucide-react';
import { ExperienceItem, CulturalContext, SocialScaffolding } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NarrativeBlockProps {
  experience: ExperienceItem;
  index: number;
  narrativeText?: string;
  culturalContext?: CulturalContext[string];
  socialScaffolding?: SocialScaffolding[string];
  onMapFocus?: () => void;
  className?: string;
  isFocused?: boolean;
}

export function NarrativeBlock({
  experience,
  index,
  narrativeText,
  culturalContext,
  socialScaffolding,
  onMapFocus,
  className,
  isFocused = false,
}: NarrativeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isFocused) setIsExpanded(true);
  }, [isFocused]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setIsExpanded((v) => !v);
  };

  const bodyText = narrativeText || experience.lore || experience.description || '';

  return (
    <div className={cn('relative', className)}>
      {index > 0 && <div className="absolute left-6 -top-4 w-0.5 h-4 bg-border" />}

      <div className="flex gap-4">
        {/* Step number */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md">
            {index + 1}
          </div>
          <div className="w-0.5 h-full bg-border mx-auto mt-2" />
        </div>

        {/* Clickable content card */}
        <div
          className={cn(
            'flex-grow pb-8 cursor-pointer rounded-xl transition-all duration-200',
            isExpanded
              ? 'bg-card border border-border shadow-sm -mx-3 px-4 py-4'
              : 'hover:bg-muted/30 rounded-lg px-1'
          )}
          onClick={handleCardClick}
        >
          {/* Timing badge + expand toggle */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="bg-background border-primary/30 text-primary">
              <Clock className="h-3 w-3 mr-1" />
              {experience.timing}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground select-none">
              {isExpanded ? (
                <><ChevronUp className="h-3.5 w-3.5" /><span>collapse</span></>
              ) : (
                <><span>details</span><ChevronDown className="h-3.5 w-3.5" /></>
              )}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold mb-1 flex items-center gap-2 group">
            {experience.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onMapFocus?.(); }}
            >
              <MapPin className="h-3.5 w-3.5" />
            </Button>
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{experience.location}</span>
          </div>

          {/* Body text — clamped when collapsed */}
          {bodyText && (
            <p className={cn(
              'text-sm text-foreground/80 leading-relaxed mb-3 transition-all duration-200',
              !isExpanded && 'line-clamp-2'
            )}>
              {bodyText}
            </p>
          )}

          {/* Inline badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <IndianRupee className="h-3 w-3 mr-1" />
              {experience.budget.toLocaleString('en-IN')}
            </Badge>
            {experience.duration_hours && (
              <Badge variant="secondary">
                <Timer className="h-3 w-3 mr-1" />
                {experience.duration_hours}h
              </Badge>
            )}
            {experience.solo_friendly && (
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <UserCheck className="h-3 w-3 mr-1" />
                Solo-sure
                {socialScaffolding?.solo_percentage && (
                  <span className="ml-1 opacity-75">({socialScaffolding.solo_percentage})</span>
                )}
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">{experience.category}</Badge>
          </div>

          {/* ── Expanded panel ── */}
          {isExpanded && (
            <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <Separator />

              {/* About — show description + lore when there's narrative text in the body */}
              {narrativeText && (experience.description || experience.lore) && (
                <DetailRow icon={<Info className="h-4 w-4" />} label="About">
                  {experience.description && <p className="text-sm text-muted-foreground">{experience.description}</p>}
                  {experience.lore && experience.lore !== experience.description && (
                    <p className="text-sm text-muted-foreground italic mt-1">"{experience.lore}"</p>
                  )}
                </DetailRow>
              )}

              {/* Operating hours + days */}
              {(experience.operating_hours || experience.operating_days?.length) && (
                <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Hours">
                  {experience.operating_hours && (
                    <p className="text-sm text-muted-foreground">{experience.operating_hours}</p>
                  )}
                  {experience.operating_days && experience.operating_days.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {experience.operating_days.map((d) => (
                        <span key={d} className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{d}</span>
                      ))}
                    </div>
                  )}
                </DetailRow>
              )}

              {/* Cultural context */}
              {culturalContext && (
                <>
                  {(culturalContext.timing || culturalContext.tip || culturalContext.solo_note) && (
                    <DetailRow icon={<Sparkles className="h-4 w-4" />} label="Local Intel">
                      {culturalContext.timing && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/70">Best time: </span>
                          {culturalContext.timing}
                        </p>
                      )}
                      {culturalContext.tip && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground/70">Tip: </span>
                          {culturalContext.tip}
                        </p>
                      )}
                      {culturalContext.solo_note && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground/70">Solo: </span>
                          {culturalContext.solo_note}
                        </p>
                      )}
                      {/* Legacy fields */}
                      {culturalContext.dress && !culturalContext.tip && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground/70">Dress: </span>
                          {culturalContext.dress}
                        </p>
                      )}
                      {culturalContext.transport && !culturalContext.tip && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground/70">Getting there: </span>
                          {culturalContext.transport}
                        </p>
                      )}
                    </DetailRow>
                  )}
                </>
              )}

              {/* Social scaffolding */}
              {socialScaffolding && (socialScaffolding.scaffolding || socialScaffolding.arrival_vibe || socialScaffolding.beginner_energy) && (
                <DetailRow icon={<Lightbulb className="h-4 w-4" />} label="Vibe">
                  {socialScaffolding.scaffolding && (
                    <p className="text-sm text-muted-foreground">{socialScaffolding.scaffolding}</p>
                  )}
                  {socialScaffolding.arrival_vibe && (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      &ldquo;{socialScaffolding.arrival_vibe}&rdquo;
                    </p>
                  )}
                  {socialScaffolding.beginner_energy && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/70">For beginners: </span>
                      {socialScaffolding.beginner_energy}
                    </p>
                  )}
                </DetailRow>
              )}

              {/* Source */}
              {experience.source && (
                <p className="text-xs text-muted-foreground/60">
                  Source: {experience.source}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMapFocus?.();
                  }}
                >
                  <Navigation className="h-3.5 w-3.5 mr-1.5" />
                  Show on Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="text-muted-foreground flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

// Skeleton for loading state
export function NarrativeBlockSkeleton() {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="w-0.5 h-32 skeleton mx-auto mt-2" />
      </div>
      <div className="flex-grow pb-8">
        <div className="h-6 w-24 skeleton rounded mb-3" />
        <div className="h-7 w-64 skeleton rounded mb-2" />
        <div className="h-4 w-32 skeleton rounded mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-3/4 skeleton rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 skeleton rounded" />
          <div className="h-6 w-24 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

// Collision suggestion card
interface CollisionSuggestionCardProps {
  title: string;
  experiences: string[];
  why: string;
}

export function CollisionSuggestionCard({
  title,
  experiences,
  why,
}: CollisionSuggestionCardProps) {
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/20 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{why}</p>
            <div className="flex flex-wrap gap-2">
              {experiences.map((exp, i) => (
                <Badge key={i} variant="outline" className="border-accent/30">
                  {exp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
