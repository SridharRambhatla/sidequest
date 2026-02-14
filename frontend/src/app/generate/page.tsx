'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, ArrowLeft, XCircle } from 'lucide-react';
import { AgentProgress, useAgentProgress } from '@/components/agent-progress';
import { InputFormState, ItineraryResponse } from '@/lib/types';
import { generateItinerary, formStateToRequest, defaultFormState } from '@/lib/api';
import { toast } from 'sonner';

export default function GeneratePage() {
  const router = useRouter();
  const [formState, setFormState] = useState<InputFormState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [result, setResult] = useState<ItineraryResponse | null>(null);

  // Agent progress simulation hook
  const { agentStates, overallProgress, currentMessage } = useAgentProgress(isGenerating);

  // Load form state from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('sidequest-form');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFormState(parsed);
      } catch {
        // If parsing fails, redirect back to home
        router.push('/');
      }
    } else {
      // No form data, redirect back
      router.push('/');
    }
  }, [router]);

  // Start generation when form state is loaded
  useEffect(() => {
    if (formState && !isGenerating && !result && !error) {
      startGeneration();
    }
  }, [formState]);

  const startGeneration = async () => {
    if (!formState) return;

    setIsGenerating(true);
    setError(null);

    try {
      const request = formStateToRequest(formState);
      const response = await generateItinerary(request);

      setResult(response);
      setIsGenerating(false);

      // Store result and navigate to itinerary page
      sessionStorage.setItem('sidequest-result', JSON.stringify(response));
      
      // Small delay to show completion state
      setTimeout(() => {
        router.push(`/itinerary/${response.session_id}`);
      }, 1000);

    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsGenerating(false);
      toast.error('Generation failed. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setIsGenerating(false);
    sessionStorage.removeItem('sidequest-form');
    router.push('/');
  };

  const handleRetry = () => {
    setError(null);
    startGeneration();
  };

  // Show loading while getting form state
  if (!formState) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Sidequest</span>
          </div>

          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Generation Failed</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push('/')}>
                  Go Back
                </Button>
                <Button onClick={handleRetry}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generating State */}
        {!error && (
          <>
            <AgentProgress
              agentStates={agentStates}
              overallProgress={overallProgress}
              currentMessage={currentMessage}
            />

            {/* Cancel button */}
            <div className="text-center mt-8">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>

            {/* Query summary */}
            <Card className="mt-8 bg-muted/30 border-0">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Creating itinerary for:</p>
                <p className="font-medium">
                  {formState.query || `Experiences from ${formState.socialMediaUrls.length} social media link(s)`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                  <span>📍 {formState.city}</span>
                  <span>💰 ₹{formState.budgetMin.toLocaleString('en-IN')} - ₹{formState.budgetMax.toLocaleString('en-IN')}</span>
                  {formState.soloPreference && <span>👤 Solo-friendly</span>}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel generation?</DialogTitle>
            <DialogDescription>
              Your Sidequest is being created. If you cancel now, you&apos;ll lose the current progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Creating
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
