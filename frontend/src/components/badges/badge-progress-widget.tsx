'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Badge as BadgeType } from '@/lib/types';
import { getBadgesCloseToUnlock, getBadgeStats, tierColors } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Award, TrendingUp } from 'lucide-react';

interface BadgeProgressWidgetProps {
  className?: string;
  compact?: boolean;
}

export function BadgeProgressWidget({ className, compact = false }: BadgeProgressWidgetProps) {
  const [badgesClose, setBadgesClose] = useState<BadgeType[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getBadgeStats> | null>(null);

  useEffect(() => {
    setBadgesClose(getBadgesCloseToUnlock(0.5));
    setStats(getBadgeStats());
  }, []);

  if (!stats) return null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-1.5 text-sm">
          <Award className="h-4 w-4 text-primary" />
          <span className="font-medium">{stats.unlocked}</span>
          <span className="text-muted-foreground">/ {stats.total}</span>
        </div>
        {badgesClose.length > 0 && (
          <BadgeUI variant="secondary" className="text-xs gap-1">
            <TrendingUp className="h-3 w-3" />
            {badgesClose.length} close
          </BadgeUI>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Your Badges
          <BadgeUI variant="secondary" className="ml-auto">
            {stats.unlocked}/{stats.total}
          </BadgeUI>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>

        {/* Badges close to unlock */}
        {badgesClose.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Almost there!
            </p>
            {badgesClose.map((badge) => {
              const progress = (badge.current_progress / badge.requirement) * 100;
              const tierStyle = tierColors[badge.tier];

              return (
                <div
                  key={badge.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg',
                    'border',
                    tierStyle.border,
                    'bg-muted/30'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      tierStyle.bg
                    )}
                  >
                    <span className="text-xl">{badge.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{badge.name}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {badge.current_progress}/{badge.requirement}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{stats.experiencesCompleted}</p>
            <p className="text-xs text-muted-foreground">Experiences</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{stats.neighborhoodsExplored}</p>
            <p className="text-xs text-muted-foreground">Neighborhoods</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">₹{(stats.totalSpend / 1000).toFixed(1)}k</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid display of all badges for profile page
interface BadgeGridProps {
  className?: string;
}

export function BadgeGrid({ className }: BadgeGridProps) {
  const [stats, setStats] = useState<ReturnType<typeof getBadgeStats> | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);

  useEffect(() => {
    setStats(getBadgeStats());
    // Get all badges from profile
    const profile = localStorage.getItem('sidequest-user-profile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        setBadges(parsed.badges || []);
      } catch {
        // ignore
      }
    }
  }, []);

  if (!stats || badges.length === 0) return null;

  // Group badges by category
  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  const categoryLabels = {
    explorer: 'Explorer Badges',
    behavior: 'Behavior Badges',
    social: 'Social Badges',
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Your Badges
        </h3>
        <BadgeUI variant="outline">
          {stats.unlocked}/{stats.total}
        </BadgeUI>
      </div>

      {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <div key={category} className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {categoryBadges.map((badge) => {
              const tierStyle = tierColors[badge.tier];
              const progress = (badge.current_progress / badge.requirement) * 100;

              return (
                <div
                  key={badge.id}
                  className={cn(
                    'relative flex flex-col items-center p-2 rounded-xl',
                    'border transition-all duration-200',
                    badge.unlocked
                      ? cn(tierStyle.border, tierStyle.bg, 'hover:shadow-md')
                      : 'border-border bg-muted/30 opacity-60 grayscale'
                  )}
                  title={badge.description}
                >
                  <div className="relative">
                    <span className="text-3xl">{badge.icon}</span>
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {badge.current_progress}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-center mt-1 font-medium line-clamp-1">
                    {badge.name}
                  </p>
                  {!badge.unlocked && (
                    <Progress value={progress} className="h-1 w-full mt-1" />
                  )}
                  {badge.unlocked && (
                    <div
                      className={cn(
                        'absolute -top-1 -right-1 w-4 h-4 rounded-full',
                        'flex items-center justify-center text-[10px]',
                        tierStyle.bg,
                        tierStyle.text,
                        'border-2 border-background'
                      )}
                    >
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
