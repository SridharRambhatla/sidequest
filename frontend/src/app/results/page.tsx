'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Sparkles,
  ArrowLeft,
  Share2,
  Map as MapIcon,
  IndianRupee,
  Clock,
  Navigation,
} from 'lucide-react';
import { InteractiveTimeline } from '@/components/timeline';
import { ItineraryResponse, ExperienceItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const ItineraryMap = dynamic(() => import('@/components/google-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-muted flex items-center justify-center">
      <MapIcon className="h-6 w-6 text-muted-foreground animate-pulse" />
    </div>
  ),
});

export default function ResultsPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedExperience, setFocusedExperience] = useState<number | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('sidequest-result');
    if (stored) {
      try {
        setItinerary(JSON.parse(stored));
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const handleExperiencesReorder = (experiences: ExperienceItem[]) => {
    if (itinerary) {
      const updated = { ...itinerary, experiences };
      setItinerary(updated);
      sessionStorage.setItem('sidequest-result', JSON.stringify(updated));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Sidequest',
          text: 'Check out my itinerary!',
          url: window.location.href,
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!itinerary) return null;

  const totalBudget = itinerary.budget_breakdown?.total_estimate || 
    itinerary.experiences.reduce((sum, exp) => sum + exp.budget, 0);

  const totalHours = Math.ceil(itinerary.experiences.length * 1.5);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Your Itinerary</span>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={showMobileMap} onOpenChange={setShowMobileMap}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <MapIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] p-0">
                <ItineraryMap
                  experiences={itinerary.experiences}
                  focusedIndex={focusedExperience}
                  onMarkerClick={setFocusedExperience}
                />
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex max-w-6xl mx-auto">
        {/* Timeline */}
        <div className="flex-1 lg:w-[55%] min-h-[calc(100vh-3.5rem)] lg:border-r border-border/50">
          <div className="p-4 lg:p-6">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4" />
                {itinerary.experiences.length} stops
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~{totalHours}h
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4" />
                {totalBudget.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Timeline */}
            <InteractiveTimeline
              experiences={itinerary.experiences}
              onExperiencesReorder={handleExperiencesReorder}
              onExperienceClick={setFocusedExperience}
            />
          </div>
        </div>

        {/* Map - Desktop */}
        <div className="hidden lg:flex lg:w-[45%] flex-col sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="flex-1">
            <ItineraryMap
              experiences={itinerary.experiences}
              focusedIndex={focusedExperience}
              onMarkerClick={setFocusedExperience}
            />
          </div>

          {/* Budget footer */}
          <Card className="m-4 mt-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Total budget</span>
                <span className="text-lg font-semibold">
                  ₹{totalBudget.toLocaleString('en-IN')}
                </span>
              </div>
              <Button className="w-full" onClick={() => toast.info('Booking coming soon')}>
                Book experiences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t border-border/50 p-3">
        <div className="flex gap-2 max-w-md mx-auto">
          <Button variant="outline" className="flex-1" onClick={() => setShowMobileMap(true)}>
            <MapIcon className="h-4 w-4 mr-1.5" />
            Map
          </Button>
          <Button className="flex-1" onClick={() => toast.info('Booking coming soon')}>
            Book · ₹{totalBudget.toLocaleString('en-IN')}
          </Button>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </main>
  );
}
