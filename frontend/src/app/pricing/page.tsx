"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Sparkles, Compass } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    features: [
      "3 itineraries per month",
      "Basic experience discovery",
      "WhatsApp sharing",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    period: "/month",
    features: [
      "Unlimited itineraries",
      "Real-time venue data",
      "PDF export",
      "Priority AI agents",
      "Save & revisit trips",
      "Public share links",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!session) {
      signIn(undefined, { callbackUrl: "/pricing" });
      return;
    }

    setLoading(true);
    try {
      const tokenRes = await fetch("/api/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${API_BASE}/api/payments/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || "Failed to start subscription");
        return;
      }

      const data = await res.json();

      if (data.short_url) {
        window.location.href = data.short_url;
      } else {
        toast.error("Payment link not available");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-semibold">Sidequest</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Simple pricing</h1>
          <p className="text-muted-foreground">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.popular
                  ? "border-primary shadow-lg relative"
                  : "border-border"
              }
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled>
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
