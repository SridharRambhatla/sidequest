'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, IndianRupee, UserCheck, Users, Sparkles } from 'lucide-react';
import { INTEREST_PODS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FilterChipsProps {
  budgetMin: number;
  budgetMax: number;
  soloPreference: boolean;
  interestPods: string[];
  crowdPreference: string;
  onRemoveBudget?: () => void;
  onRemoveSolo?: () => void;
  onRemoveInterest?: (id: string) => void;
  onRemoveCrowd?: () => void;
  onClearAll?: () => void;
  className?: string;
}

export function FilterChips({
  budgetMin,
  budgetMax,
  soloPreference,
  interestPods,
  crowdPreference,
  onRemoveBudget,
  onRemoveSolo,
  onRemoveInterest,
  onRemoveCrowd,
  onClearAll,
  className,
}: FilterChipsProps) {
  const hasFilters =
    budgetMin !== 200 ||
    budgetMax !== 5000 ||
    soloPreference ||
    interestPods.length > 0 ||
    crowdPreference !== 'relatively_niche';

  if (!hasFilters) return null;

  const crowdLabels: Record<string, string> = {
    crowded: 'Crowded',
    relatively_niche: 'Relatively Niche',
    super_niche: 'Super Niche',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground mr-1">Active filters:</span>

      {/* Budget filter */}
      {(budgetMin !== 200 || budgetMax !== 5000) && (
        <FilterChip
          icon={<IndianRupee className="h-3 w-3" />}
          label={`₹${budgetMin.toLocaleString('en-IN')} - ₹${budgetMax.toLocaleString('en-IN')}`}
          onRemove={onRemoveBudget}
        />
      )}

      {/* Solo preference */}
      {soloPreference && (
        <FilterChip
          icon={<UserCheck className="h-3 w-3" />}
          label="Solo-friendly"
          onRemove={onRemoveSolo}
        />
      )}

      {/* Crowd preference */}
      {crowdPreference !== 'relatively_niche' && (
        <FilterChip
          icon={<Users className="h-3 w-3" />}
          label={crowdLabels[crowdPreference]}
          onRemove={onRemoveCrowd}
        />
      )}

      {/* Interest pods */}
      {interestPods.map((podId) => {
        const pod = INTEREST_PODS.find((p) => p.id === podId);
        if (!pod) return null;
        return (
          <FilterChip
            key={podId}
            icon={<Sparkles className="h-3 w-3" />}
            label={pod.label}
            onRemove={() => onRemoveInterest?.(podId)}
          />
        );
      })}

      {/* Clear all button */}
      {hasFilters && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

interface FilterChipProps {
  icon?: React.ReactNode;
  label: string;
  onRemove?: () => void;
}

function FilterChip({ icon, label, onRemove }: FilterChipProps) {
  return (
    <Badge
      variant="secondary"
      className="pl-2 pr-1 py-1 h-7 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      <span className="text-xs font-medium">{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

// Interest pod selector component
interface InterestPodSelectorProps {
  selected: string[];
  onChange: (pods: string[]) => void;
  className?: string;
}

export function InterestPodSelector({
  selected,
  onChange,
  className,
}: InterestPodSelectorProps) {
  const togglePod = (podId: string) => {
    if (selected.includes(podId)) {
      onChange(selected.filter((id) => id !== podId));
    } else {
      onChange([...selected, podId]);
    }
  };

  const podIcons: Record<string, string> = {
    food_nerd: '🍽️',
    craft_explorer: '🎨',
    heritage_walker: '🏛️',
    fitness_enthusiast: '💪',
    art_culture: '🎭',
    nature_lover: '🌿',
    nightlife: '🎵',
    shopping: '🛍️',
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {INTEREST_PODS.map((pod) => {
        const isSelected = selected.includes(pod.id);
        return (
          <button
            key={pod.id}
            type="button"
            onClick={() => togglePod(pod.id)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
            )}
          >
            <span>{podIcons[pod.id]}</span>
            <span>{pod.label}</span>
          </button>
        );
      })}
    </div>
  );
}
