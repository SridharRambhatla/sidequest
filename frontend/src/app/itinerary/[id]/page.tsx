'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Sparkles,
  ArrowLeft,
  Share2,
  Download,
  Map as MapIcon,
  RefreshCw,
  IndianRupee,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { NarrativeBlock, NarrativeBlockSkeleton, CollisionSuggestionCard } from '@/components/narrative-block';
import { BudgetBreakdown } from '@/components/budget-breakdown';
import { ItineraryResponse, ExperienceItem } from '@/lib/types';
import { cn } from '@/lib/utils';

// Dynamically import the map component (Leaflet doesn't work with SSR)
const ItineraryMap = dynamic(() => import('@/components/itinerary-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-muted flex items-center justify-center">
      <div className="text-center">
        <MapIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

export default function ItineraryPage() {
  const router = useRouter();
  const params = useParams();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedExperience, setFocusedExperience] = useState<number | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const narrativeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load itinerary from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('sidequest-result');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItinerary(parsed);
      } catch {
        // If parsing fails, redirect back
        router.push('/');
      }
    } else {
      // No result, redirect back
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const handleMapFocus = (index: number) => {
    setFocusedExperience(index);
  };

  const handleMarkerClick = (index: number) => {
    setFocusedExperience(index);
    // Scroll to the narrative block
    narrativeRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Sidequest Itinerary',
          text: 'Check out my experience itinerary created with Sidequest!',
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleExport = () => {
    // TODO: Implement PDF export
    console.log('Export PDF');
  };

  const handleNewItinerary = () => {
    sessionStorage.removeItem('sidequest-result');
    sessionStorage.removeItem('sidequest-form');
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your itinerary...</p>
        </div>
      </main>
    );
  }

  if (!itinerary) {
    return null;
  }

  // Parse narrative sections (split by experience mentions)
  const narrativeSections = parseNarrativeSections(
    itinerary.narrative_itinerary,
    itinerary.experiences
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">New Sidequest</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Your Sidequest</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile map toggle */}
            <Sheet open={showMobileMap} onOpenChange={setShowMobileMap}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <MapIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] p-0">
                <ItineraryMap
                  experiences={itinerary.experiences}
                  focusedIndex={focusedExperience}
                  onMarkerClick={handleMarkerClick}
                />
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left Panel - Narrative (60%) */}
        <div className="flex-1 lg:w-[60%] min-h-[calc(100vh-4rem)] border-r border-border">
          <div className="p-6 lg:p-8 max-w-3xl">
            {/* Opening hook */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">
                Your Story Begins...
              </h1>
              {itinerary.narrative_itinerary && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {getOpeningHook(itinerary.narrative_itinerary)}
                </p>
              )}
            </div>

            <Separator className="my-8" />

            {/* Experience timeline */}
            <div className="space-y-2">
              {itinerary.experiences.map((experience, index) => (
                <div
                  key={index}
                  ref={(el) => { narrativeRefs.current[index] = el; }}
                >
                  <NarrativeBlock
                    experience={experience}
                    index={index}
                    narrativeText={narrativeSections[index]}
                    culturalContext={itinerary.cultural_context?.[experience.name]}
                    socialScaffolding={itinerary.social_scaffolding?.[experience.name]}
                    onMapFocus={() => handleMapFocus(index)}
                    className={cn(
                      'transition-all duration-300',
                      focusedExperience === index && 'bg-primary/5 -mx-4 px-4 py-2 rounded-lg'
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Collision suggestion */}
            {itinerary.collision_suggestion && (
              <div className="mt-8">
                <Separator className="mb-8" />
                <h3 className="text-lg font-semibold mb-4">Your Next Adventure</h3>
                <CollisionSuggestionCard
                  title={itinerary.collision_suggestion.title}
                  experiences={itinerary.collision_suggestion.experiences}
                  why={itinerary.collision_suggestion.why}
                />
              </div>
            )}

            {/* Budget breakdown */}
            {itinerary.budget_breakdown && (
              <div className="mt-8">
                <Separator className="mb-8" />
                <BudgetBreakdown budget={itinerary.budget_breakdown} />
              </div>
            )}

            {/* Action bar */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleNewItinerary} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Create New Sidequest
                </Button>
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map (40%) - Desktop only */}
        <div className="hidden lg:block lg:w-[40%] sticky top-16 h-[calc(100vh-4rem)]">
          <ItineraryMap
            experiences={itinerary.experiences}
            focusedIndex={focusedExperience}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>

      {/* Floating mobile action bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden glass border-t border-border p-4">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowMobileMap(true)}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            View Map
          </Button>
          <Button className="flex-1" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </main>
  );
}

// Helper function to get opening hook from narrative
function getOpeningHook(narrative: string): string {
  // Get the first paragraph or first 200 characters
  const firstParagraph = narrative.split('\n\n')[0];
  if (firstParagraph.length > 250) {
    return firstParagraph.substring(0, 250) + '...';
  }
  return firstParagraph;
}

// Helper function to parse narrative sections per experience
function parseNarrativeSections(
  narrative: string,
  experiences: ExperienceItem[]
): string[] {
  // Simple split - in production, use more sophisticated parsing
  const sections: string[] = [];
  
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    // Look for the experience name or timing in the narrative
    const searchTerms = [exp.name, exp.timing];
    let section = '';
    
    for (const term of searchTerms) {
      const idx = narrative.toLowerCase().indexOf(term.toLowerCase());
      if (idx !== -1) {
        // Get ~500 chars around the mention
        const start = Math.max(0, idx - 50);
        const end = Math.min(narrative.length, idx + 450);
        section = narrative.substring(start, end);
        if (start > 0) section = '...' + section;
        if (end < narrative.length) section = section + '...';
        break;
      }
    }
    
    sections.push(section || exp.description || exp.lore || '');
  }
  
  return sections;
}
