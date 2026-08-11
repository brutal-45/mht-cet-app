import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAP Cut-off Finder · MH Engineering 2025-26",
  description:
    "Search any Maharashtra engineering college by college code (e.g. 01002) to view CAP Round 1 branch-wise cut-off ranks and percentiles for FY 2025-26. Developed under Brutal Tools.",
  keywords: [
    "MH CAP",
    "CAP Round 1",
    "Engineering Cut-off",
    "Maharashtra Engineering Admissions",
    "College Code Search",
    "MHT-CET",
    "2025-26",
    "Brutal Tools",
  ],
  authors: [{ name: "Brutal Tools" }],
  openGraph: {
    title: "CAP Cut-off Finder · MH Engineering 2025-26",
    description: "Search any college by code to view CAP Round 1 branch-wise cut-offs. Developed under Brutal Tools.",
    url: "https://chat.z.ai",
    siteName: "CAP Cut-off Finder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CAP Cut-off Finder · MH Engineering 2025-26",
    description: "Search any college by code to view CAP Round 1 branch-wise cut-offs. Developed under Brutal Tools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
