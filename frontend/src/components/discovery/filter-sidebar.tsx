'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  IndianRupee,
  UserCheck,
  Users,
  Clock,
  CloudSun,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';
import { DiscoveryFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  filters: DiscoveryFilters;
  onFiltersChange: (filters: DiscoveryFilters) => void;
  activeFilterCount: number;
  className?: string;
}

const crowdOptions = [
  { value: 'any', label: 'Any' },
  { value: 'low', label: 'Quiet', icon: '🟢' },
  { value: 'moderate', label: 'Moderate', icon: '🟡' },
  { value: 'high', label: 'Busy', icon: '🔴' },
] as const;

const durationOptions = [
  { value: 'any', label: 'Any Duration' },
  { value: '1-2', label: '1-2 hours' },
  { value: 'half-day', label: 'Half day' },
  { value: 'full-day', label: 'Full day' },
] as const;

export function FilterSidebar({
  filters,
  onFiltersChange,
  activeFilterCount,
  className,
}: FilterSidebarProps) {
  const updateFilter = <K extends keyof DiscoveryFilters>(
    key: K,
    value: DiscoveryFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      categories: [],
      budgetRange: [0, 5000],
      soloFriendly: false,
      crowdPreference: 'any',
      duration: 'any',
      weatherAppropriate: false,
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Budget Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <IndianRupee className="h-4 w-4" />
            Budget Range
          </Label>
          <span className="text-sm text-muted-foreground">
            ₹{filters.budgetRange[0].toLocaleString('en-IN')} - ₹
            {filters.budgetRange[1].toLocaleString('en-IN')}
          </span>
        </div>
        <Slider
          min={0}
          max={5000}
          step={100}
          value={filters.budgetRange}
          onValueChange={(value) =>
            updateFilter('budgetRange', value as [number, number])
          }
          className="py-2"
        />
        {/* Budget histogram visualization */}
        <div className="flex items-end gap-0.5 h-8 px-1">
          {[1, 3, 5, 8, 12, 15, 10, 7, 4, 2].map((height, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t transition-colors',
                i >= Math.floor(filters.budgetRange[0] / 500) &&
                  i <= Math.floor(filters.budgetRange[1] / 500)
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
              style={{ height: `${(height / 15) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Solo-Friendly Toggle */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="solo-friendly"
          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
        >
          <UserCheck className="h-4 w-4" />
          Solo-friendly only
        </Label>
        <Switch
          id="solo-friendly"
          checked={filters.soloFriendly}
          onCheckedChange={(checked) => updateFilter('soloFriendly', checked)}
        />
      </div>

      <Separator />

      {/* Crowd Preference */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" />
          Crowd Level
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {crowdOptions.map((option) => (
            <Button
              key={option.value}
              variant={filters.crowdPreference === option.value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'justify-start',
                filters.crowdPreference === option.value && 'bg-primary'
              )}
              onClick={() => updateFilter('crowdPreference', option.value)}
            >
              {'icon' in option && <span className="mr-1">{option.icon}</span>}
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Duration */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          Duration
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {durationOptions.map((option) => (
            <Button
              key={option.value}
              variant={filters.duration === option.value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'justify-start text-xs',
                filters.duration === option.value && 'bg-primary'
              )}
              onClick={() => updateFilter('duration', option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Weather Appropriate */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="weather-appropriate"
          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
        >
          <CloudSun className="h-4 w-4" />
          Weather-appropriate only
        </Label>
        <Switch
          id="weather-appropriate"
          checked={filters.weatherAppropriate}
          onCheckedChange={(checked) => updateFilter('weatherAppropriate', checked)}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block w-72 flex-shrink-0',
          'p-5 border-r border-border bg-card',
          className
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <FilterContent />
      </aside>

      {/* Mobile Bottom Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 shadow-lg rounded-full gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <SheetTitle>Filters</SheetTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset all
                </Button>
              )}
            </SheetHeader>
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] pr-2">
              <FilterContent />
            </div>
            <SheetFooter className="pt-4 border-t mt-4">
              <Button className="w-full">
                Show results
                {activeFilterCount > 0 && ` (${activeFilterCount} filters)`}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

// Quick filter chips for hero section
interface QuickFilterChipsProps {
  activeFilters: string[];
  onToggle: (filterId: string) => void;
}

const quickFilters = [
  { id: 'solo', label: 'Solo-friendly', icon: '👤' },
  { id: 'under500', label: 'Under ₹500', icon: '💰' },
  { id: 'tonight', label: 'Tonight', icon: '🌙' },
  { id: 'weekend', label: 'This Weekend', icon: '📅' },
  { id: 'outdoor', label: 'Outdoor', icon: '☀️' },
  { id: 'free', label: 'Free', icon: '🎁' },
];

export function QuickFilterChips({ activeFilters, onToggle }: QuickFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => onToggle(filter.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-sm font-medium transition-all duration-200',
              'border',
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-white/80 dark:bg-black/40 text-foreground border-white/20 hover:bg-white dark:hover:bg-black/60'
            )}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            {isActive && (
              <X className="h-3 w-3 ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
