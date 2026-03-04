'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Sparkles,
  ArrowLeft,
  Share2,
  Map as MapIcon,
  IndianRupee,
  Clock,
  Navigation,
  Wallet,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import { InteractiveTimeline } from '@/components/timeline';
import { BudgetBreakdown } from '@/components/budget-breakdown';
import { ItineraryResponse, ExperienceItem, InputFormState, CulturalContext, SocialScaffolding } from '@/lib/types';
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

// ── Day grouping ──────────────────────────────────────────────────────
interface DayGroup {
  dayNumber: number;
  experiences: ExperienceItem[];
  totalBudget: number;
  startTime: string;
  endTime: string;
}

function groupByDay(experiences: ExperienceItem[]): DayGroup[] {
  const map = new Map<number, ExperienceItem[]>();
  for (const exp of experiences) {
    const d = exp.day ?? 1;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(exp);
  }
  const sorted = Array.from(map.entries()).sort(([a], [b]) => a - b);
  return sorted.map(([dayNumber, exps]) => {
    const times = exps.map(e => e.start_time).filter(Boolean) as string[];
    const startTime = times.length ? times[0] : '06:00';
    // estimate end from last start + duration
    const lastExp = exps[exps.length - 1];
    const lastStart = lastExp.start_time ?? '18:00';
    const [lh, lm] = lastStart.split(':').map(Number);
    const endMins = (lh * 60 + lm) + Math.round((lastExp.duration_hours ?? 1.5) * 60);
    const endH = Math.min(Math.floor(endMins / 60), 23);
    const endM = endMins % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    return {
      dayNumber,
      experiences: exps,
      totalBudget: exps.reduce((s, e) => s + (e.budget ?? 0), 0),
      startTime,
      endTime,
    };
  });
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function getDayLabel(dayNumber: number, totalDays: number): string {
  if (totalDays === 1) return 'Today';
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() + dayNumber - 1);
  return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
}

const categoryEmoji: Record<string, string> = {
  food: '🍽️', craft: '🎨', heritage: '🏛️', nature: '🌿',
  art: '🎭', music: '🎵', fitness: '🌅', shopping: '🛍️', networking: '🤝',
};

// ── DaySection component ──────────────────────────────────────────────
interface DaySectionProps {
  group: DayGroup;
  dayLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  culturalContext?: CulturalContext;
  socialScaffolding?: SocialScaffolding;
  onExperienceClick: (globalIndex: number) => void;
  globalIndexOffset: number;
}

function DaySection({
  group,
  dayLabel,
  isOpen,
  onToggle,
  culturalContext,
  socialScaffolding,
  onExperienceClick,
  globalIndexOffset,
}: DaySectionProps) {
  const categorySet = [...new Set(group.experiences.map(e => e.category))];
  const themeLabel = categorySet.slice(0, 2).map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' & ');

  return (
    <div className={cn(
      'rounded-xl border bg-card shadow-sm transition-shadow duration-200',
      isOpen ? 'shadow-md border-primary/20' : 'hover:shadow-md'
    )}>
      {/* Header — always visible, click to toggle */}
      <button
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5 flex-shrink-0">
            DAY {group.dayNumber}
          </Badge>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{dayLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {group.experiences.length} stops · {group.startTime} – {group.endTime}
              {themeLabel ? ` · ${themeLabel}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            ₹{group.totalBudget.toLocaleString('en-IN')}
          </span>
          <div className={cn(
            'w-6 h-6 rounded-full bg-muted flex items-center justify-center transition-transform duration-300',
            isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-muted-foreground'
          )}>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* Preview chips — visible when collapsed */}
      {!isOpen && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {group.experiences.slice(0, 4).map((exp, i) => (
            <span
              key={i}
              className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full"
            >
              {categoryEmoji[exp.category] ?? '✨'} {exp.name.length > 22 ? exp.name.slice(0, 22) + '…' : exp.name}
            </span>
          ))}
          {group.experiences.length > 4 && (
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              +{group.experiences.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Collapsible timeline */}
      <div className={cn(
        'grid transition-all duration-300',
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 border-t border-border/50">
            <InteractiveTimeline
              experiences={group.experiences}
              culturalContext={culturalContext}
              socialScaffolding={socialScaffolding}
              dayStartTime={group.startTime}
              onExperienceClick={(localIdx) => onExperienceClick(globalIndexOffset + localIdx)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [formState, setFormState] = useState<InputFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedExperience, setFocusedExperience] = useState<number | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [showMobileBudget, setShowMobileBudget] = useState(false);
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1])); // Day 1 open by default

  useEffect(() => {
    const stored = sessionStorage.getItem('sidequest-result');
    const storedForm = sessionStorage.getItem('sidequest-form');
    if (stored) {
      try {
        const parsed: ItineraryResponse = JSON.parse(stored);
        setItinerary(parsed);
        if (storedForm) setFormState(JSON.parse(storedForm));
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const dayGroups = useMemo(() => itinerary ? groupByDay(itinerary.experiences) : [], [itinerary]);

  const handleExperiencesReorder = (dayNumber: number, newExps: ExperienceItem[]) => {
    if (!itinerary) return;
    const updated = {
      ...itinerary,
      experiences: itinerary.experiences
        .filter(e => (e.day ?? 1) !== dayNumber)
        .concat(newExps),
    };
    setItinerary(updated);
    sessionStorage.setItem('sidequest-result', JSON.stringify(updated));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'My Sidequest', url: window.location.href }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    }
  };

  const toggleDay = (dayNumber: number) => {
    setOpenDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
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
    itinerary.experiences.reduce((s, e) => s + e.budget, 0);
  const numDays = itinerary.num_days ?? dayGroups.length ?? 1;
  const totalHours = numDays === 1 ? 15 : numDays * 15;

  // Cumulative offset for global index mapping
  let globalOffset = 0;

  return (
    <main className="min-h-screen bg-muted/30">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold">Your Itinerary</span>
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

      {/* ── Stats bar ── */}
      <div className="bg-background border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-0 overflow-x-auto">
          {[
            { icon: <Navigation className="h-3.5 w-3.5" />, value: itinerary.experiences.length, label: 'stops' },
            { icon: <Clock className="h-3.5 w-3.5" />, value: `~${totalHours}h`, label: '' },
            { icon: <IndianRupee className="h-3.5 w-3.5" />, value: totalBudget.toLocaleString('en-IN'), label: '' },
            { icon: <CalendarDays className="h-3.5 w-3.5" />, value: `${numDays} Day${numDays > 1 ? 's' : ''}`, label: '' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground px-4 border-r border-border/50 last:border-r-0 first:pl-0 whitespace-nowrap">
              <span className="text-primary">{stat.icon}</span>
              <strong className="text-foreground font-semibold">{stat.value}</strong>
              {stat.label && <span>{stat.label}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex max-w-6xl mx-auto">

        {/* Left: Day sections */}
        <div className="flex-1 lg:w-[55%] min-h-[calc(100vh-7rem)] lg:border-r border-border/50">
          <div className="p-4 lg:p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
              Your Plan
            </p>

            {dayGroups.map((group) => {
              const offset = globalOffset;
              globalOffset += group.experiences.length;
              return (
                <DaySection
                  key={group.dayNumber}
                  group={group}
                  dayLabel={getDayLabel(group.dayNumber, numDays)}
                  isOpen={openDays.has(group.dayNumber)}
                  onToggle={() => toggleDay(group.dayNumber)}
                  culturalContext={itinerary.cultural_context}
                  socialScaffolding={itinerary.social_scaffolding}
                  onExperienceClick={setFocusedExperience}
                  globalIndexOffset={offset}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Map + Budget (desktop only, sticky) */}
        <div className="hidden lg:flex lg:w-[45%] flex-col sticky top-[6.5rem] h-[calc(100vh-6.5rem)]">
          <div className="flex-1 overflow-hidden">
            <ItineraryMap
              experiences={itinerary.experiences}
              focusedIndex={focusedExperience}
              onMarkerClick={setFocusedExperience}
            />
          </div>

          {itinerary.budget_breakdown && itinerary.budget_breakdown.breakdown?.length > 0 ? (
            <div className="m-4 mt-0 max-h-[42%] overflow-y-auto">
              <BudgetBreakdown
                budget={itinerary.budget_breakdown}
                targetBudget={{
                  min: formState?.budgetMin || 200,
                  max: formState?.budgetMax || 5000,
                }}
              />
              <Button className="w-full mt-3" onClick={() => toast.info('Booking coming soon')}>
                Book experiences
              </Button>
            </div>
          ) : (
            <Card className="m-4 mt-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total budget</span>
                  <span className="text-lg font-semibold">₹{totalBudget.toLocaleString('en-IN')}</span>
                </div>
                <Button className="w-full" onClick={() => toast.info('Booking coming soon')}>
                  Book experiences
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Budget Sheet */}
      <Sheet open={showMobileBudget} onOpenChange={setShowMobileBudget}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          {itinerary.budget_breakdown && itinerary.budget_breakdown.breakdown?.length > 0 ? (
            <div className="pt-4">
              <BudgetBreakdown
                budget={itinerary.budget_breakdown}
                targetBudget={{ min: formState?.budgetMin || 200, max: formState?.budgetMax || 5000 }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <IndianRupee className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold mt-2">₹{totalBudget.toLocaleString('en-IN')}</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t border-border/50 p-3">
        <div className="flex gap-2 max-w-md mx-auto">
          <Button variant="outline" size="sm" onClick={() => setShowMobileMap(true)}>
            <MapIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileBudget(true)}
            className={cn(
              itinerary.budget_breakdown && !itinerary.budget_breakdown.within_budget && 'border-destructive text-destructive'
            )}
          >
            <Wallet className="h-4 w-4" />
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
