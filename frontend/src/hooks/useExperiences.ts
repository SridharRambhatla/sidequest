'use client';

/**
 * useExperiences Hook
 * 
 * Fetches experiences from the Discovery API with fallback to sample data.
 * Handles loading, error states, and caching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DiscoveryExperience } from '@/lib/types';
import { discoverExperiences, DiscoverRequest } from '@/lib/api';
import { SAMPLE_EXPERIENCES } from '@/lib/sample-data';

interface UseExperiencesOptions {
  /** Initial request parameters */
  initialRequest?: DiscoverRequest;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Use sample data as fallback on API error (default: true) */
  useFallback?: boolean;
  /** Cache duration in ms (default: 5 minutes) */
  cacheDuration?: number;
}

interface UseExperiencesReturn {
  experiences: DiscoveryExperience[];
  isLoading: boolean;
  error: Error | null;
  isFallback: boolean;
  totalCount: number;
  refetch: (request?: DiscoverRequest) => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: DiscoveryExperience[]; timestamp: number; totalCount: number }>();

function getCacheKey(request: DiscoverRequest): string {
  return JSON.stringify(request);
}

export function useExperiences(options: UseExperiencesOptions = {}): UseExperiencesReturn {
  const {
    initialRequest = {},
    fetchOnMount = true,
    useFallback = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [experiences, setExperiences] = useState<DiscoveryExperience[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);

  const fetchExperiences = useCallback(async (request: DiscoverRequest = {}) => {
    const cacheKey = getCacheKey(request);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setExperiences(cached.data);
      setTotalCount(cached.totalCount);
      setIsFallback(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await discoverExperiences(request);
      
      if (!isMounted.current) return;

      setExperiences(response.experiences);
      setTotalCount(response.total_count);
      setIsFallback(false);
      
      // Cache the result
      cache.set(cacheKey, {
        data: response.experiences,
        totalCount: response.total_count,
        timestamp: Date.now(),
      });
    } catch (err) {
      if (!isMounted.current) return;

      const error = err instanceof Error ? err : new Error('Failed to fetch experiences');
      setError(error);
      
      // Use sample data as fallback
      if (useFallback) {
        console.warn('Discovery API failed, using sample data as fallback:', error.message);
        setExperiences(SAMPLE_EXPERIENCES);
        setTotalCount(SAMPLE_EXPERIENCES.length);
        setIsFallback(true);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [cacheDuration, useFallback]);

  // Initial fetch on mount
  useEffect(() => {
    isMounted.current = true;
    
    if (fetchOnMount) {
      fetchExperiences(initialRequest);
    }

    return () => {
      isMounted.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(async (request?: DiscoverRequest) => {
    // Clear cache for this request to force fresh fetch
    const cacheKey = getCacheKey(request || initialRequest);
    cache.delete(cacheKey);
    await fetchExperiences(request || initialRequest);
  }, [fetchExperiences, initialRequest]);

  return {
    experiences,
    isLoading,
    error,
    isFallback,
    totalCount,
    refetch,
  };
}

/**
 * Clear the experiences cache
 * Useful when you want to force fresh data
 */
export function clearExperiencesCache(): void {
  cache.clear();
}
