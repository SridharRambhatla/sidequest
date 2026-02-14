import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sidequest - Plot-First Experience Discovery",
  description: "Turn social media inspiration into story-driven, culturally-grounded experiences. Powered by 5 AI agents.",
  keywords: ["travel", "experiences", "Bangalore", "AI", "itinerary", "solo travel", "local experiences"],
  authors: [{ name: "Sidequest Team" }],
  openGraph: {
    title: "Sidequest - Plot-First Experience Discovery",
    description: "Turn social inspiration into story-driven experiences",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
