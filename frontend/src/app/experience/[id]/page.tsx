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
  Users,
  Star,
  Navigation,
  ExternalLink,
  Calendar,
  Cloud,
  Sun,
  Umbrella,
  Sparkles,
  BookmarkPlus,
  Share2,
} from 'lucide-react';
import { DiscoveryExperience } from '@/lib/types';
import { SAMPLE_EXPERIENCES } from '@/lib/sample-data';
import { cn } from '@/lib/utils';
import WeatherIndicator from '@/components/weather-indicator';

export default function ExperienceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [experience, setExperience] = useState<DiscoveryExperience | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get experience from sessionStorage first (passed from explore page)
    const storedExp = sessionStorage.getItem('selected-experience');
    if (storedExp) {
      try {
        const parsed = JSON.parse(storedExp);
        if (parsed.id === params.id) {
          setExperience(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored experience:', e);
      }
    }

    // Fallback: find in sample data
    const found = SAMPLE_EXPERIENCES.find((exp) => exp.id === params.id);
    if (found) {
      setExperience(found);
    }
    setLoading(false);
  }, [params.id]);

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

  if (!experience) {
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

  const getTimingLabel = () => {
    switch (experience.timing.type) {
      case 'flexible':
        return 'Flexible timing';
      case 'scheduled':
        return 'Fixed schedule';
      case 'time_sensitive':
        return 'Time sensitive';
      default:
        return 'Check timing';
    }
  };

  const getBookingCTA = () => {
    if (experience.timing.advance_booking_required) {
      return `Book ${experience.timing.advance_days_minimum || 1}+ days ahead`;
    }
    return 'Walk-in welcome';
  };

  const handleGetDirections = () => {
    const destination = encodeURIComponent(
      `${experience.name}, ${experience.location.neighborhood}, Bangalore`
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: experience.name,
          text: experience.description_short,
          url: window.location.href,
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
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

      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={experience.image_url}
          alt={experience.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge variant="secondary" className="mb-2">
            {experience.category}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {experience.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{experience.location.neighborhood}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{experience.timing.duration_hours}h</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {experience.budget.min === 0
                  ? 'Free'
                  : `₹${experience.budget.min}-${experience.budget.max}`}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              {experience.rating && (
                <>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">
                    {experience.rating} ({experience.review_count})
                  </span>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-muted-foreground leading-relaxed">
            {experience.description_short}
          </p>
        </section>

        {/* Weather & Rain Handling */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Weather Suitability</h2>
          <WeatherIndicator experience={experience} showDetails />
        </section>

        {/* Solo Friendly */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Solo Friendliness</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      experience.solo_friendly.is_solo_sure
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {experience.solo_friendly.is_solo_sure
                        ? 'Great for solo visitors'
                        : 'Better with company'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {Math.round(experience.solo_friendly.confidence_score * 100)}%
                    </p>
                  </div>
                </div>
                <Badge
                  variant={experience.solo_friendly.is_solo_sure ? 'default' : 'secondary'}
                >
                  {experience.solo_friendly.is_solo_sure ? 'Solo Sure' : 'Group Friendly'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Timing & Booking */}
        <section>
          <h2 className="text-lg font-semibold mb-3">When to Visit</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{getTimingLabel()}</span>
                </div>
                <Badge variant="outline">{getBookingCTA()}</Badge>
              </div>
              {experience.timing.advance_booking_required && (
                <p className="text-sm text-muted-foreground">
                  Advance booking required at least {experience.timing.advance_days_minimum || 1} day(s) before your visit.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Crowd Level */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Current Crowd</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      experience.crowd_level.current === 'low'
                        ? 'bg-green-500'
                        : experience.crowd_level.current === 'moderate'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    )}
                  />
                  <span className="capitalize">{experience.crowd_level.current} crowd</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated recently
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Availability */}
        {experience.availability.status !== 'available' && (
          <section>
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="font-medium">
                    {experience.availability.status === 'limited'
                      ? 'Limited availability - book soon!'
                      : 'Currently sold out'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t border-border/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleGetDirections}
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </Button>
            <Button className="flex-1 gap-2">
              <ExternalLink className="h-4 w-4" />
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
