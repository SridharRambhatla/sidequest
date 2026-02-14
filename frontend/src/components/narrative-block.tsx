'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  MapPin,
  IndianRupee,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Calendar,
  Navigation,
  Info,
  Sparkles,
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
}

export function NarrativeBlock({
  experience,
  index,
  narrativeText,
  culturalContext,
  socialScaffolding,
  onMapFocus,
  className,
}: NarrativeBlockProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {/* Timeline connector */}
      {index > 0 && (
        <div className="absolute left-6 -top-4 w-0.5 h-4 bg-border" />
      )}

      <div className="flex gap-4">
        {/* Timeline dot with number */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md">
            {index + 1}
          </div>
          {/* Vertical line to next item */}
          <div className="w-0.5 h-full bg-border mx-auto mt-2" />
        </div>

        {/* Content */}
        <div className="flex-grow pb-8">
          {/* Time badge */}
          <Badge 
            variant="outline" 
            className="mb-3 bg-background border-primary/30 text-primary"
          >
            <Clock className="h-3 w-3 mr-1" />
            {experience.timing}
          </Badge>

          {/* Experience title */}
          <h3 className="text-xl font-semibold mb-2 group">
            {experience.name}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onMapFocus}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <MapPin className="h-3.5 w-3.5" />
            <span>{experience.location}</span>
          </div>

          {/* Narrative text / Lore */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            {narrativeText ? (
              <p className="text-foreground leading-relaxed">
                {narrativeText}
              </p>
            ) : experience.lore ? (
              <p className="text-foreground leading-relaxed">
                {experience.lore}
              </p>
            ) : experience.description && (
              <p className="text-foreground leading-relaxed">
                {experience.description}
              </p>
            )}
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Budget */}
            <Badge variant="secondary" className="bg-muted">
              <IndianRupee className="h-3 w-3 mr-1" />
              {experience.budget.toLocaleString('en-IN')}
            </Badge>

            {/* Solo-friendly */}
            {experience.solo_friendly && (
              <Badge className="bg-secondary/20 text-secondary-foreground border border-secondary/30">
                <UserCheck className="h-3 w-3 mr-1" />
                Solo-sure
                {socialScaffolding?.solo_percentage && (
                  <span className="ml-1 opacity-75">
                    ({socialScaffolding.solo_percentage} solo)
                  </span>
                )}
              </Badge>
            )}

            {/* Category */}
            <Badge variant="outline">
              {experience.category}
            </Badge>
          </div>

          {/* Expandable cultural context */}
          {(culturalContext || socialScaffolding) && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -ml-2"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Info className="h-4 w-4 mr-2" />
                {showDetails ? 'Hide' : 'Show'} local tips
                {showDetails ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </Button>

              {showDetails && (
                <Card className="mt-3 bg-muted/50 border-muted animate-fade-in">
                  <CardContent className="p-4 space-y-3">
                    {/* Cultural context */}
                    {culturalContext && (
                      <>
                        {culturalContext.timing && (
                          <div className="flex gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Best Time</p>
                              <p className="text-sm text-muted-foreground">{culturalContext.timing}</p>
                            </div>
                          </div>
                        )}
                        {culturalContext.dress && (
                          <div className="flex gap-3">
                            <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Dress Code</p>
                              <p className="text-sm text-muted-foreground">{culturalContext.dress}</p>
                            </div>
                          </div>
                        )}
                        {culturalContext.transport && (
                          <div className="flex gap-3">
                            <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Getting There</p>
                              <p className="text-sm text-muted-foreground">{culturalContext.transport}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Social scaffolding */}
                    {socialScaffolding && (
                      <>
                        <Separator className="my-2" />
                        {socialScaffolding.scaffolding && (
                          <div className="flex gap-3">
                            <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Social Vibe</p>
                              <p className="text-sm text-muted-foreground">{socialScaffolding.scaffolding}</p>
                            </div>
                          </div>
                        )}
                        {socialScaffolding.arrival_vibe && (
                          <p className="text-sm text-muted-foreground italic pl-7">
                            &ldquo;{socialScaffolding.arrival_vibe}&rdquo;
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" size="sm" onClick={onMapFocus}>
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>
        </div>
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
