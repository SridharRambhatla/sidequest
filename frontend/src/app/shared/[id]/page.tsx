"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MapPin,
  Clock,
  IndianRupee,
  CalendarDays,
  Navigation,
  Map as MapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ItineraryMap = dynamic(() => import("@/components/google-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-muted flex items-center justify-center">
      <MapIcon className="h-6 w-6 text-muted-foreground animate-pulse" />
    </div>
  ),
});

export default function SharedItineraryPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/itineraries/${params.id}/public`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Itinerary not found or not public"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Link href="/">
            <Button>Create your own itinerary</Button>
          </Link>
        </div>
      </div>
    );
  }

  const experiences = data.experiences || [];
  const totalBudget =
    data.budget_breakdown?.total_estimate ||
    experiences.reduce((s: number, e: any) => s + (e.budget || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Sidequest</span>
          </div>
          <Link href="/">
            <Button size="sm">Plan your trip</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {data.city}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {data.num_days} day{data.num_days > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5" />
              {experiences.length} stops
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {totalBudget.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="h-64 rounded-xl overflow-hidden border">
          <ItineraryMap
            experiences={experiences}
            focusedIndex={null}
          />
        </div>

        {/* Narrative */}
        {data.narrative_itinerary && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {data.narrative_itinerary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Experiences list */}
        <div className="space-y-3">
          {experiences.map((exp: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{exp.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {exp.category}
                      </Badge>
                      {exp.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exp.start_time}
                        </span>
                      )}
                      {exp.budget > 0 && (
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {exp.budget}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            Want your own personalized itinerary?
          </p>
          <Link href="/">
            <Button>Create with Sidequest</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
