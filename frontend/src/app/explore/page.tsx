'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Search,
  Sliders,
  X,
} from 'lucide-react';
import {
  DiscoveryCard,
  DiscoveryCardSkeleton,
  WeatherWidget,
  CategoryTabs,
} from '@/components/discovery';
import { SAMPLE_EXPERIENCES } from '@/lib/sample-data';
import { DiscoveryExperience, DiscoveryFilters } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const defaultFilters: DiscoveryFilters = {
  categories: [],
  budgetRange: [0, 5000],
  soloFriendly: false,
  crowdPreference: 'any',
  duration: 'any',
  weatherAppropriate: false,
};

// Quick filter options
const quickFilters = [
  { id: 'solo', label: 'Solo-friendly' },
  { id: 'under500', label: 'Under ₹500' },
  { id: 'free', label: 'Free' },
] as const;

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  // Filter experiences
  const filteredExperiences = useMemo(() => {
    let results = [...SAMPLE_EXPERIENCES];

    // Category
    if (selectedCategory !== 'all') {
      results = results.filter((exp) => exp.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (exp) =>
          exp.name.toLowerCase().includes(q) ||
          exp.description_short.toLowerCase().includes(q) ||
          exp.location.neighborhood.toLowerCase().includes(q)
      );
    }

    // Quick filters
    activeQuickFilters.forEach((f) => {
      if (f === 'solo') results = results.filter((e) => e.solo_friendly.is_solo_sure);
      if (f === 'under500') results = results.filter((e) => e.budget.max <= 500);
      if (f === 'free') results = results.filter((e) => e.budget.max === 0);
    });

    return results;
  }, [selectedCategory, searchQuery, activeQuickFilters]);

  const toggleQuickFilter = useCallback((id: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const handleExperienceSelect = (experience: DiscoveryExperience) => {
    sessionStorage.setItem('selected-experience', JSON.stringify(experience));
    const formState = {
      query: experience.name,
      socialMediaUrls: [],
      city: 'Bangalore',
      budgetMin: experience.budget.min,
      budgetMax: experience.budget.max,
      numPeople: 1,
      soloPreference: experience.solo_friendly.is_solo_sure,
      interestPods: [],
      crowdPreference: 'relatively_niche' as const,
    };
    sessionStorage.setItem('sidequest-form', JSON.stringify(formState));
    router.push('/generate');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setActiveQuickFilters([]);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || activeQuickFilters.length > 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">Sidequest</span>
            </Link>
            <WeatherWidget compact />
          </div>

          {/* Search */}
          <div className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search experiences..."
                className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="pb-3 -mx-4 px-4">
            <CategoryTabs
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeQuickFilters.includes(filter.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredExperiences.length} experience{filteredExperiences.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {filteredExperiences.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExperiences.map((experience) => (
              <DiscoveryCard
                key={experience.id}
                experience={experience}
                onSelect={() => handleExperienceSelect(experience)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No experiences found</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
