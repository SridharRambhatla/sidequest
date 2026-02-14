'use client';

import { useRef } from 'react';
import {
  Sparkles,
  Utensils,
  Palette,
  Landmark,
  Heart,
  Theater,
  Trees,
  Music,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  selected: string;
  onSelect: (category: string) => void;
  className?: string;
}

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'Food & Drink', label: 'Food', icon: Utensils },
  { id: 'Craft Workshop', label: 'Workshops', icon: Palette },
  { id: 'Heritage Walk', label: 'Heritage', icon: Landmark },
  { id: 'Fitness', label: 'Fitness', icon: Heart },
  { id: 'Art & Culture', label: 'Art', icon: Theater },
  { id: 'Nature', label: 'Nature', icon: Trees },
  { id: 'Nightlife', label: 'Nightlife', icon: Music },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag },
];

export function CategoryTabs({ selected, onSelect, className }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5"
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selected === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'text-sm font-medium whitespace-nowrap transition-colors',
                isSelected
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
