"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listItineraries, deleteItinerary, toggleItineraryPublic, SavedItinerary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserMenu } from "@/components/user-menu";
import {
  Compass,
  MapPin,
  Calendar,
  Trash2,
  Globe,
  Lock,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function ItinerariesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadItineraries();
    }
  }, [status]);

  async function loadItineraries() {
    try {
      const data = await listItineraries();
      setItineraries(data);
    } catch {
      toast.error("Failed to load itineraries");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItinerary(id);
      setItineraries((prev) => prev.filter((it) => it.id !== id));
      toast.success("Itinerary deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleTogglePublic(id: string, current: boolean) {
    try {
      await toggleItineraryPublic(id, !current);
      setItineraries((prev) =>
        prev.map((it) => (it.id === id ? { ...it, is_public: !current } : it))
      );
      toast.success(current ? "Made private" : "Made public — share link ready");
    } catch {
      toast.error("Failed to update");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Home
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">My Trips</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {itineraries.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Compass className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No saved trips yet</p>
            <Link href="/">
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Create your first itinerary
              </Button>
            </Link>
          </div>
        ) : (
          itineraries.map((it) => (
            <Card key={it.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/itinerary/${it.id}`} className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{it.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {it.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {it.num_days} day{it.num_days > 1 ? "s" : ""}
                      </span>
                      <span>{it.experience_count} stops</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(it.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublic(it.id, it.is_public)}
                      title={it.is_public ? "Make private" : "Make public"}
                    >
                      {it.is_public ? (
                        <Globe className="h-4 w-4 text-green-600" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(it.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
