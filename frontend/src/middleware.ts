export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/itineraries/:path*", "/profile/:path*"],
};
