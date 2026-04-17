/**
 * Sidequest API Client
 * Connects to the FastAPI backend for itinerary generation
 */

import { ItineraryRequest, ItineraryResponse, InputFormState, DiscoveryExperience, City } from './types';

// ──────────────────────────────────────────────
// Types for Discovery API
// ──────────────────────────────────────────────

export interface DiscoverRequest {
  query?: string;
  city?: string; // Optional in request object, but validated as required by API
  categories?: string[];
  budget_min?: number;
  budget_max?: number;
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  solo_friendly_only?: boolean;
  limit?: number;
  /** If true, return curated data only (instant). If false, combine curated + agent-generated. */
  fast_mode?: boolean;
}

export interface DiscoverResponse {
  experiences: DiscoveryExperience[];
  total_count: number;
  filters_applied: Record<string, unknown>;
  /** Number of curated experiences in response */
  curated_count: number;
  /** Number of agent-generated experiences in response */
  agent_count: number;
  /** Source: 'curated', 'agent', or 'hybrid' */
  source: 'curated' | 'agent' | 'hybrid';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window === 'undefined') return headers;
  try {
    const now = Date.now();
    if (!cachedToken || now > tokenExpiry) {
      const res = await fetch('/api/token');
      const data = await res.json();
      if (data?.token) {
        cachedToken = data.token;
        tokenExpiry = now + 4 * 60 * 1000; // cache 4 min
      }
    }
    if (cachedToken) {
      headers['Authorization'] = `Bearer ${cachedToken}`;
    }
  } catch {
    // No auth available
  }
  return headers;
}

export function clearAuthCache() {
  cachedToken = null;
  tokenExpiry = 0;
}

/**
 * Convert frontend form state to API request format
 */
export function formStateToRequest(formState: InputFormState): ItineraryRequest {
  return {
    query: formState.query,
    social_media_urls: formState.socialMediaUrls.filter(url => url.trim() !== ''),
    city: formState.city,
    budget_min: formState.budgetMin,
    budget_max: formState.budgetMax,
    num_people: formState.numPeople,
    solo_preference: formState.soloPreference,
    interest_pods: formState.interestPods,
    crowd_preference: formState.crowdPreference,
    start_date: formState.startDate,
    end_date: formState.endDate,
    time_available_hours: formState.timeAvailableHours,
    start_time: formState.startTime,
  };
}

/**
 * Generate an itinerary using the multi-agent backend
 * @throws Error if city parameter is missing
 */
export async function generateItinerary(
  request: ItineraryRequest
): Promise<ItineraryResponse> {
  // Validate that city is provided
  if (!request.city) {
    throw new Error('City parameter is required for itinerary generation');
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/generate-itinerary`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Itinerary generation failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE}/health`);
  
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  
  return response.json();
}

/**
 * Get agent trace for a session (for real-time updates)
 */
export async function getAgentTrace(
  sessionId: string
): Promise<{ session_id: string; trace: unknown[]; message: string }> {
  const response = await fetch(`${API_BASE}/api/agent-trace/${sessionId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch agent trace');
  }
  
  return response.json();
}

/**
 * Fetch supported cities from the backend
 */
export async function fetchCities(): Promise<City[]> {
  const response = await fetch(`${API_BASE}/api/cities`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch cities');
  }
  
  const data = await response.json();
  return data.cities || [];
}

/**
 * Validate if a URL is a supported social media link
 */
export function isValidSocialMediaUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Extract platform name from URL
 */
export function getPlatformFromUrl(url: string): string | null {
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com')) return 'TikTok';
  return null;
}

/**
 * Default form state
 */
export const defaultFormState: InputFormState = {
  query: '',
  socialMediaUrls: [],
  city: '', // No default - require user selection
  budgetMin: 200,
  budgetMax: 5000,
  numPeople: 1,
  soloPreference: true,
  interestPods: [],
  crowdPreference: 'relatively_niche',
};

// ──────────────────────────────────────────────
// Discovery API (for Explore page)
// ──────────────────────────────────────────────

/**
 * Discover experiences for the explore page
 * Calls the backend Discovery Agent to find experiences based on filters
 * 
 * @param request - Discovery request parameters (city is required)
 * @param request.fast_mode - If true, returns curated data only (instant). If false, combines curated + agent-generated.
 * @throws Error if city parameter is missing
 */
export async function discoverExperiences(
  request: DiscoverRequest
): Promise<DiscoverResponse> {
  // Validate that city is provided
  if (!request.city) {
    throw new Error('City parameter is required for discovery');
  }

  const response = await fetch(`${API_BASE}/api/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: request.query || null,
      city: request.city, // Required parameter
      categories: request.categories || [],
      budget_min: request.budget_min ?? 0,
      budget_max: request.budget_max ?? 10000,
      time_of_day: request.time_of_day || null,
      solo_friendly_only: request.solo_friendly_only ?? false,
      limit: request.limit ?? 25,
      fast_mode: request.fast_mode ?? false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discovery failed: ${errorText}`);
  }

  return response.json();
}


// ──────────────────────────────────────────────
// Itinerary CRUD (authenticated)
// ──────────────────────────────────────────────

export interface SavedItinerary {
  id: string;
  title: string;
  city: string;
  num_days: number;
  query: string;
  is_public: boolean;
  created_at: string;
  experience_count: number;
}

export async function listItineraries(): Promise<SavedItinerary[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/itineraries`, { headers });
  if (!res.ok) throw new Error('Failed to fetch itineraries');
  const data = await res.json();
  return data.itineraries;
}

export async function getItinerary(id: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/itineraries/${id}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch itinerary');
  return res.json();
}

export async function saveItinerary(data: Record<string, any>): Promise<{ id: string; title: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/itineraries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save itinerary');
  return res.json();
}

export async function deleteItinerary(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/itineraries/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete itinerary');
}

export async function toggleItineraryPublic(id: string, isPublic: boolean): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/itineraries/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_public: isPublic }),
  });
  if (!res.ok) throw new Error('Failed to update itinerary');
}
