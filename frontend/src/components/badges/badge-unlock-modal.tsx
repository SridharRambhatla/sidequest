'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge as BadgeType } from '@/lib/types';
import { tierColors } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Share2, X } from 'lucide-react';

interface BadgeUnlockModalProps {
  badge: BadgeType | null;
  isOpen: boolean;
  onClose: () => void;
  nextBadgeHint?: string;
}

export function BadgeUnlockModal({
  badge,
  isOpen,
  onClose,
  nextBadgeHint,
}: BadgeUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && badge) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, badge]);

  if (!badge) return null;

  const tierStyle = tierColors[badge.tier];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I earned the ${badge.name} badge!`,
          text: `Just unlocked "${badge.name}" on Sidequest! ${badge.description}`,
          url: window.location.origin,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#4A90A4', '#7BA388', '#C4846C', '#E9B44C', '#a855f7'][
                    Math.floor(Math.random() * 5)
                  ],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random() * 1}s`,
                }}
              />
            ))}
          </div>
        )}

        <DialogHeader className="text-center pt-4">
          {/* Badge icon with animation */}
          <div className="mx-auto mb-4 relative">
            <div
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                'border-4 animate-badge-unlock',
                tierStyle.bg,
                tierStyle.border
              )}
            >
              <span className="text-5xl animate-bounce-slow">{badge.icon}</span>
            </div>
            {/* Glow effect */}
            <div
              className={cn(
                'absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse',
                tierStyle.bg
              )}
            />
          </div>

          <DialogTitle className="text-2xl font-bold">
            🎉 Badge Unlocked!
          </DialogTitle>
          <DialogDescription className="text-base">
            You&apos;ve earned the <strong className={tierStyle.text}>{badge.name}</strong> badge!
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">{badge.description}</p>

          {/* Tier indicator */}
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              tierStyle.bg,
              tierStyle.text
            )}
          >
            <span className="capitalize">{badge.tier}</span> Tier
          </div>

          {/* Next badge hint */}
          {nextBadgeHint && (
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium">Next goal:</span> {nextBadgeHint}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Continue Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add keyframe animation to globals.css
// This is the CSS you'll need to add:
/*
@keyframes confetti {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(720deg);
    opacity: 0;
  }
}

@keyframes badge-unlock {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-confetti {
  animation: confetti 2s ease-out forwards;
}

.animate-badge-unlock {
  animation: badge-unlock 0.8s ease-out forwards;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
*/
