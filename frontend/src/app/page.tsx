'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  UserCheck,
  MapPin,
  ArrowRight,
  Instagram,
  Youtube,
} from 'lucide-react';
import { InterestPodSelector } from '@/components/filter-chips';
import { InputFormState, INTEREST_PODS } from '@/lib/types';
import { defaultFormState, isValidSocialMediaUrl, getPlatformFromUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [formState, setFormState] = useState<InputFormState>(defaultFormState);
  const [showPreferences, setShowPreferences] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    if (!isValidSocialMediaUrl(urlInput)) {
      setUrlError('Please enter a valid Instagram Reel, YouTube, or TikTok URL');
      return;
    }

    setFormState((prev) => ({
      ...prev,
      socialMediaUrls: [...prev.socialMediaUrls, urlInput.trim()],
    }));
    setUrlInput('');
    setUrlError('');
  };

  const handleUrlRemove = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      socialMediaUrls: prev.socialMediaUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validate that we have some input
    if (!formState.query.trim() && formState.socialMediaUrls.length === 0) {
      return;
    }

    setIsSubmitting(true);

    // Store form state in sessionStorage for the generate page
    sessionStorage.setItem('sidequest-form', JSON.stringify(formState));

    // Navigate to generate page
    router.push('/generate');
  };

  const canSubmit =
    formState.query.trim().length > 0 || formState.socialMediaUrls.length > 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold">Sidequest</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 tracking-tight">
            Turn social inspiration into{' '}
            <span className="text-primary">story-driven experiences</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Paste an Instagram Reel, describe a vibe, or tell us what you&apos;re in the mood for.
            Our AI agents will craft your perfect local adventure.
          </p>

          {/* Input Card */}
          <Card className="max-w-2xl mx-auto shadow-lg border-border/50">
            <CardContent className="p-6">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="text" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Describe
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Paste URL
                  </TabsTrigger>
                </TabsList>

                {/* Text Input Tab */}
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="e.g., Solo pottery workshop for complete beginners, or a heritage coffee walk through old Bangalore neighborhoods..."
                      className="min-h-[120px] resize-none text-base"
                      value={formState.query}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, query: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Be specific about what you&apos;re looking for — activities, vibes, timing preferences
                    </p>
                  </div>
                </TabsContent>

                {/* URL Input Tab */}
                <TabsContent value="url" className="space-y-4">
                  <div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste Instagram Reel or YouTube URL..."
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          setUrlError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUrlAdd();
                          }
                        }}
                        className={cn(urlError && 'border-destructive')}
                      />
                      <Button onClick={handleUrlAdd} variant="secondary">
                        Add
                      </Button>
                    </div>
                    {urlError && (
                      <p className="text-xs text-destructive mt-1">{urlError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                      <Instagram className="h-3.5 w-3.5" />
                      <Youtube className="h-3.5 w-3.5" />
                      We&apos;ll extract experiences from the video content
                    </p>
                  </div>

                  {/* Added URLs */}
                  {formState.socialMediaUrls.length > 0 && (
                    <div className="space-y-2">
                      {formState.socialMediaUrls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                        >
                          <Badge variant="secondary" className="shrink-0">
                            {getPlatformFromUrl(url)}
                          </Badge>
                          <span className="text-sm truncate flex-1">{url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => handleUrlRemove(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optional query with URL */}
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Add context (optional)
                    </Label>
                    <Input
                      placeholder="e.g., looking for similar experiences in Bangalore"
                      className="mt-2"
                      value={formState.query}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, query: e.target.value }))
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* City selector */}
              <div className="flex items-center gap-2 mt-4 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Exploring in</span>
                <Badge variant="outline" className="font-medium">
                  {formState.city}
                </Badge>
              </div>

              {/* Preferences Toggle */}
              <button
                type="button"
                onClick={() => setShowPreferences(!showPreferences)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-2 border-t border-border"
              >
                <span>Customize preferences</span>
                {showPreferences ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Expanded Preferences */}
              {showPreferences && (
                <div className="space-y-6 pt-4 animate-fade-in">
                  {/* Budget Range */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Budget Range
                      </Label>
                      <span className="text-sm font-medium">
                        ₹{formState.budgetMin.toLocaleString('en-IN')} -{' '}
                        ₹{formState.budgetMax.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Slider
                      min={200}
                      max={10000}
                      step={100}
                      value={[formState.budgetMin, formState.budgetMax]}
                      onValueChange={([min, max]) =>
                        setFormState((prev) => ({
                          ...prev,
                          budgetMin: min,
                          budgetMax: max,
                        }))
                      }
                      className="py-2"
                    />
                  </div>

                  {/* Solo Preference */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="solo-preference"
                      className="flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Solo-friendly experiences only
                    </Label>
                    <Switch
                      id="solo-preference"
                      checked={formState.soloPreference}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          soloPreference: checked,
                        }))
                      }
                    />
                  </div>

                  {/* Interest Pods */}
                  <div className="space-y-3">
                    <Label>Interests (select all that apply)</Label>
                    <InterestPodSelector
                      selected={formState.interestPods}
                      onChange={(pods) =>
                        setFormState((prev) => ({
                          ...prev,
                          interestPods: pods,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                size="lg"
                className="w-full mt-6 h-12 text-base font-semibold"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Starting your Sidequest...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Your Sidequest
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              5 AI agents collaborate
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Story-driven itineraries
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent" />
              Solo-sure recommendations
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">
          How Sidequest Works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Share your inspiration',
              description:
                'Paste an Instagram Reel, describe what you\'re in the mood for, or share a vibe.',
              icon: '✨',
            },
            {
              step: '2',
              title: '5 AI agents collaborate',
              description:
                'Discovery, Cultural Context, Community, Plot-Builder, and Budget agents work together.',
              icon: '🤖',
            },
            {
              step: '3',
              title: 'Get your story',
              description:
                'Receive a narrative itinerary with lore, cultural context, and solo-sure recommendations.',
              icon: '📖',
            },
          ].map((item) => (
            <Card key={item.step} className="text-center p-6 bg-muted/30 border-0">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built for Gemini 3 Bengaluru Hackathon 2026 •{' '}
            <a href="#" className="hover:text-foreground transition-colors">
              Open Source
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
