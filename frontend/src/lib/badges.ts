/**
 * Badges / Gamification System
 * Stores user progress in localStorage
 */

import { Badge, UserProfile } from './types';

const STORAGE_KEY = 'sidequest-user-profile';

// Badge definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'current_progress' | 'unlocked' | 'unlocked_at'>[] = [
  // Explorer badges
  {
    id: 'cultural-explorer-bronze',
    name: 'Cultural Explorer',
    description: 'Complete 3 Art & Culture experiences',
    category: 'explorer',
    icon: '🎭',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'cultural-explorer-silver',
    name: 'Cultural Curator',
    description: 'Complete 7 Art & Culture experiences',
    category: 'explorer',
    icon: '🎭',
    requirement: 7,
    tier: 'silver',
  },
  {
    id: 'cultural-explorer-gold',
    name: 'Cultural Connoisseur',
    description: 'Complete 15 Art & Culture experiences',
    category: 'explorer',
    icon: '🎭',
    requirement: 15,
    tier: 'gold',
  },
  {
    id: 'food-adventurer-bronze',
    name: 'Food Explorer',
    description: 'Try 5 different cuisines',
    category: 'explorer',
    icon: '🍽️',
    requirement: 5,
    tier: 'bronze',
  },
  {
    id: 'food-adventurer-silver',
    name: 'Food Adventurer',
    description: 'Try 10 different cuisines',
    category: 'explorer',
    icon: '🍽️',
    requirement: 10,
    tier: 'silver',
  },
  {
    id: 'outdoor-enthusiast-bronze',
    name: 'Outdoor Explorer',
    description: 'Complete 3 outdoor activities',
    category: 'explorer',
    icon: '🌿',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'night-owl-bronze',
    name: 'Night Owl',
    description: 'Complete 3 evening experiences',
    category: 'explorer',
    icon: '🦉',
    requirement: 3,
    tier: 'bronze',
  },
  // Behavior badges
  {
    id: 'solo-pioneer-bronze',
    name: 'Solo Pioneer',
    description: 'Complete 3 solo experiences',
    category: 'behavior',
    icon: '🚀',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'solo-pioneer-silver',
    name: 'Solo Adventurer',
    description: 'Complete 7 solo experiences',
    category: 'behavior',
    icon: '🚀',
    requirement: 7,
    tier: 'silver',
  },
  {
    id: 'solo-pioneer-gold',
    name: 'Solo Master',
    description: 'Complete 15 solo experiences',
    category: 'behavior',
    icon: '🚀',
    requirement: 15,
    tier: 'gold',
  },
  {
    id: 'craft-enthusiast-bronze',
    name: 'Craft Enthusiast',
    description: 'Complete 3 workshops',
    category: 'behavior',
    icon: '🎨',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'local-legend-bronze',
    name: 'Local Legend',
    description: 'Explore 5 different neighborhoods',
    category: 'behavior',
    icon: '📍',
    requirement: 5,
    tier: 'bronze',
  },
  {
    id: 'local-legend-silver',
    name: 'City Expert',
    description: 'Explore 10 different neighborhoods',
    category: 'behavior',
    icon: '📍',
    requirement: 10,
    tier: 'silver',
  },
  {
    id: 'budget-master-bronze',
    name: 'Budget Master',
    description: 'Complete 5 experiences under ₹500',
    category: 'behavior',
    icon: '💰',
    requirement: 5,
    tier: 'bronze',
  },
  // Social badges
  {
    id: 'review-guru-bronze',
    name: 'Reviewer',
    description: 'Write 3 reviews',
    category: 'social',
    icon: '⭐',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'review-guru-silver',
    name: 'Review Guru',
    description: 'Write 10 reviews',
    category: 'social',
    icon: '⭐',
    requirement: 10,
    tier: 'silver',
  },
  {
    id: 'photographer-bronze',
    name: 'Photographer',
    description: 'Upload 10 photos',
    category: 'social',
    icon: '📸',
    requirement: 10,
    tier: 'bronze',
  },
  {
    id: 'helpful-human-bronze',
    name: 'Helpful Human',
    description: 'Receive 5 helpful marks on reviews',
    category: 'social',
    icon: '🤝',
    requirement: 5,
    tier: 'bronze',
  },
];

// Initialize default user profile
function createDefaultProfile(): UserProfile {
  return {
    badges: BADGE_DEFINITIONS.map((def) => ({
      ...def,
      current_progress: 0,
      unlocked: false,
    })),
    experiences_completed: 0,
    neighborhoods_explored: [],
    interest_pods_active: [],
    total_spend: 0,
    created_at: new Date().toISOString(),
  };
}

// Get user profile from localStorage
export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return createDefaultProfile();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const defaultProfile = createDefaultProfile();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return createDefaultProfile();
  }
}

// Save user profile to localStorage
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// Update badge progress
export function updateBadgeProgress(
  badgeId: string,
  progress: number
): { badge: Badge; justUnlocked: boolean } | null {
  const profile = getUserProfile();
  const badgeIndex = profile.badges.findIndex((b) => b.id === badgeId);
  
  if (badgeIndex === -1) return null;

  const badge = profile.badges[badgeIndex];
  const wasUnlocked = badge.unlocked;
  
  badge.current_progress = Math.min(progress, badge.requirement);
  
  if (!wasUnlocked && badge.current_progress >= badge.requirement) {
    badge.unlocked = true;
    badge.unlocked_at = new Date().toISOString();
  }

  profile.badges[badgeIndex] = badge;
  saveUserProfile(profile);

  return {
    badge,
    justUnlocked: !wasUnlocked && badge.unlocked,
  };
}

// Increment badge progress
export function incrementBadgeProgress(badgeId: string): { badge: Badge; justUnlocked: boolean } | null {
  const profile = getUserProfile();
  const badge = profile.badges.find((b) => b.id === badgeId);
  
  if (!badge) return null;

  return updateBadgeProgress(badgeId, badge.current_progress + 1);
}

// Record completed experience
export function recordExperienceCompletion(
  category: string,
  neighborhood: string,
  isSolo: boolean,
  cost: number,
  isEvening: boolean = false,
  isOutdoor: boolean = false
): Badge[] {
  const profile = getUserProfile();
  const unlockedBadges: Badge[] = [];

  // Increment total experiences
  profile.experiences_completed += 1;
  profile.total_spend += cost;

  // Track neighborhood
  if (!profile.neighborhoods_explored.includes(neighborhood)) {
    profile.neighborhoods_explored.push(neighborhood);
  }

  saveUserProfile(profile);

  // Check and update relevant badges
  const badgeChecks = [
    // Category-based badges
    { condition: category === 'Art & Culture', badges: ['cultural-explorer-bronze', 'cultural-explorer-silver', 'cultural-explorer-gold'] },
    { condition: category === 'Food & Drink', badges: ['food-adventurer-bronze', 'food-adventurer-silver'] },
    { condition: category === 'Craft Workshop', badges: ['craft-enthusiast-bronze'] },
    { condition: isOutdoor, badges: ['outdoor-enthusiast-bronze'] },
    { condition: isEvening, badges: ['night-owl-bronze'] },
    // Behavior badges
    { condition: isSolo, badges: ['solo-pioneer-bronze', 'solo-pioneer-silver', 'solo-pioneer-gold'] },
    { condition: cost < 500, badges: ['budget-master-bronze'] },
  ];

  badgeChecks.forEach(({ condition, badges }) => {
    if (condition) {
      badges.forEach((badgeId) => {
        const result = incrementBadgeProgress(badgeId);
        if (result?.justUnlocked) {
          unlockedBadges.push(result.badge);
        }
      });
    }
  });

  // Check neighborhood exploration badges
  const neighborhoodCount = getUserProfile().neighborhoods_explored.length;
  if (neighborhoodCount >= 5) {
    const result = updateBadgeProgress('local-legend-bronze', neighborhoodCount);
    if (result?.justUnlocked) unlockedBadges.push(result.badge);
  }
  if (neighborhoodCount >= 10) {
    const result = updateBadgeProgress('local-legend-silver', neighborhoodCount);
    if (result?.justUnlocked) unlockedBadges.push(result.badge);
  }

  return unlockedBadges;
}

// Get badges close to unlocking (for motivation)
export function getBadgesCloseToUnlock(threshold: number = 0.7): Badge[] {
  const profile = getUserProfile();
  return profile.badges
    .filter((badge) => {
      if (badge.unlocked) return false;
      const progress = badge.current_progress / badge.requirement;
      return progress >= threshold && progress < 1;
    })
    .sort((a, b) => {
      const progressA = a.current_progress / a.requirement;
      const progressB = b.current_progress / b.requirement;
      return progressB - progressA;
    })
    .slice(0, 3);
}

// Get unlocked badges
export function getUnlockedBadges(): Badge[] {
  return getUserProfile().badges.filter((b) => b.unlocked);
}

// Get badge stats
export function getBadgeStats() {
  const profile = getUserProfile();
  const unlocked = profile.badges.filter((b) => b.unlocked).length;
  const total = profile.badges.length;
  
  return {
    unlocked,
    total,
    percentage: Math.round((unlocked / total) * 100),
    experiencesCompleted: profile.experiences_completed,
    neighborhoodsExplored: profile.neighborhoods_explored.length,
    totalSpend: profile.total_spend,
  };
}

// Tier colors for display
export const tierColors = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-600',
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-400 dark:border-yellow-600',
  },
};
