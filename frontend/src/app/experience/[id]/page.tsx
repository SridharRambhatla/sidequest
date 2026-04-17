'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Clock,
  IndianRupee,
  Star,
  Navigation,
  ExternalLink,
  Phone,
  Globe,
  Sparkles,
  BookmarkPlus,
  Share2,
  MessageSquare,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PlaceDetail {
  fsq_id: string;
  name: string;
  categories: string[];
  description: string;
  photos: string[];
  location: {
    address: string;
    neighborhood: string[];
    lat: number;
    lng: number;
    locality: string;
  };
  contact: {
    tel: string | null;
    website: string | null;
    social_media: Record<string, string>;
  };
  hours: {
    display: string;
    is_open: boolean | null;
    regular: any[];
  };
  rating: number | null;
  price: number | null;
  stats: Record<string, number>;
  tips: { text: string; created_at: string }[];
  tastes: string[];
  booking_links: {
    google_maps: string;
    directions: string;
  };
}

export default function ExperienceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [fallbackData, setFallbackData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;

    // Check if this is a Foursquare ID (starts with a hex string)
    const isFsqId = /^[0-9a-f]{20,}$/i.test(id);

    if (isFsqId) {
      fetchPlaceDetail(id);
    } else {
      // Fall back to sessionStorage for legacy/curated experiences
      const storedExp = sessionStorage.getItem('selected-experience');
      if (storedExp) {
        try {
          const parsed = JSON.parse(storedExp);
          if (parsed.id === id || parsed.fsq_id === id) {
            setFallbackData(parsed);
            if (parsed.fsq_id) {
              fetchPlaceDetail(parsed.fsq_id);
              return;
            }
          }
        } catch {}
      }
      setLoading(false);
    }
  }, [params.id]);

  async function fetchPlaceDetail(fsqId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/experiences/${fsqId}`);
      if (res.ok) {
        const data = await res.json();
        setPlace(data);
      }
    } catch {
      // Keep fallback data if API fails
    } finally {
      setLoading(false);
    }
  }

  const handleShare = async () => {
    const title = place?.name || fallbackData?.name || 'Experience';
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground">Loading experience...</p>
        </div>
      </main>
    );
  }

  if (!place && !fallbackData) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Experience not found</p>
          <Button variant="outline" onClick={() => router.push('/explore')}>
            Back to Explore
          </Button>
        </div>
      </main>
    );
  }

  // Use place data if available, otherwise fall back to stored experience
  const name = place?.name || fallbackData?.name || '';
  const categories = place?.categories || [fallbackData?.category || ''];
  const description = place?.description || fallbackData?.description_short || '';
  const photos = place?.photos || (fallbackData?.image_url ? [fallbackData.image_url] : []);
  const address = place?.location?.address || fallbackData?.location?.neighborhood || '';
  const rating = place?.rating || fallbackData?.rating;
  const hoursDisplay = place?.hours?.display || '';
  const isOpen = place?.hours?.is_open;
  const tel = place?.contact?.tel;
  const website = place?.contact?.website;
  const tips = place?.tips || [];
  const tastes = place?.tastes || [];
  const directionsUrl = place?.booking_links?.directions ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ', ' + address)}`;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Sidequest</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <BookmarkPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Photos */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {photos.length > 0 ? (
          <img src={photos[0]} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 mb-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{name}</h1>
        </div>
      </div>

      {/* Photo gallery (if multiple) */}
      {photos.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.slice(1, 6).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${name} photo ${i + 2}`}
                className="h-20 w-28 object-cover rounded-lg shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{address}</span>
            </CardContent>
          </Card>
          {hoursDisplay && (
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{hoursDisplay}</span>
              </CardContent>
            </Card>
          )}
          {rating && (
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm">{(rating / 2).toFixed(1)} / 5</span>
              </CardContent>
            </Card>
          )}
          {isOpen !== null && (
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">{isOpen ? 'Open now' : 'Closed'}</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Description */}
        {description && (
          <section>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </section>
        )}

        {/* Tastes / Tags */}
        {tastes.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Known For</h2>
            <div className="flex flex-wrap gap-2">
              {tastes.slice(0, 10).map((taste) => (
                <Badge key={taste} variant="outline">{taste}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Tips / Reviews */}
        {tips.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Visitor Tips</h2>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{tip.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {(tel || website) && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Contact</h2>
            <div className="flex flex-wrap gap-3">
              {tel && (
                <a href={`tel:${tel}`}>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    {tel}
                  </Button>
                </a>
              )}
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </Button>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t border-border/50">
          <div className="flex gap-3">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Navigation className="h-4 w-4" />
                Get Directions
              </Button>
            </a>
            {website ? (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Book Now
                </Button>
              </a>
            ) : (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on Maps
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
