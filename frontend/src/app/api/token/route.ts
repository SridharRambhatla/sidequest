import { auth } from "@/lib/auth";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ token: null });
  }

  // Create a JWT with user info that the backend can verify
  const token = await encode({
    token: {
      email: session.user.email,
      name: session.user.name,
      picture: session.user.image,
      provider: (session as any).accessToken?.provider || "google",
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: "authjs.session-token",
  });

  return NextResponse.json({ token });
}
