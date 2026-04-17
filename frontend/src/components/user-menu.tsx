"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User, LogOut, BookOpen } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn()}>
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/itineraries">
        <Button variant="ghost" size="sm">
          <BookOpen className="h-4 w-4 mr-1" />
          My Trips
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
