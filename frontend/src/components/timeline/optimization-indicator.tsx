'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Zap, RotateCw, Check, X, Clock, CloudRain, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizationChange {
  type: 'reorder' | 'weather' | 'booking';
  description: string;
  impact: string;
}

interface OptimizationIndicatorProps {
  isOptimizing: boolean;
  isOptimized: boolean;
  changes?: OptimizationChange[];
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
}

const changeIcons = {
  reorder: Clock,
  weather: CloudRain,
  booking: Calendar,
};

export function OptimizationIndicator({
  isOptimizing,
  isOptimized,
  changes = [],
  onAccept,
  onReject,
  className,
}: OptimizationIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (isOptimizing) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <RotateCw className="h-3 w-3 animate-spin" />
        Optimizing...
      </span>
    );
  }

  if (!isOptimized || changes.length === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-secondary', className)}>
        <Zap className="h-3 w-3" />
        Optimized
      </span>
    );
  }

  return (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogTrigger asChild>
        <button className={cn('inline-flex items-center gap-1.5 text-xs text-accent hover:underline', className)}>
          <Zap className="h-3 w-3" />
          {changes.length} suggestion{changes.length !== 1 ? 's' : ''}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggestions</DialogTitle>
          <DialogDescription>
            We found ways to improve your itinerary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {changes.map((change, index) => {
            const Icon = changeIcons[change.type];
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{change.description}</p>
                  <p className="text-xs text-muted-foreground">{change.impact}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { setShowDetails(false); onReject?.(); }}>
            Keep current
          </Button>
          <Button onClick={() => { setShowDetails(false); onAccept?.(); }}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
