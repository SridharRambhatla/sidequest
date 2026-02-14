/**
 * Sidequest API Client
 * Connects to the FastAPI backend for itinerary generation
 */

import { ItineraryRequest, ItineraryResponse, InputFormState } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  };
}

/**
 * Generate an itinerary using the multi-agent backend
 */
export async function generateItinerary(
  request: ItineraryRequest
): Promise<ItineraryResponse> {
  const response = await fetch(`${API_BASE}/api/generate-itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  city: 'Bangalore',
  budgetMin: 200,
  budgetMax: 5000,
  numPeople: 1,
  soloPreference: true,
  interestPods: [],
  crowdPreference: 'relatively_niche',
};
