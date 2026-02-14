import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format time string (e.g., "9:00 AM")
 */
export function formatTime(time: string): string {
  try {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return time;
  }
}

/**
 * Sleep utility for demo delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract Instagram/YouTube URL validation
 */
export function isValidSocialMediaUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname.includes('instagram.com') || 
         hostname.includes('youtube.com') || 
         hostname.includes('youtu.be');
}
