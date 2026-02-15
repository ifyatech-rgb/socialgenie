import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/design-system.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { RouteChangeProgress } from "@/components/route-change-progress";
import { PreconnectLinks } from "@/components/preconnect-links";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "SocialGenie - Your Partner to Go Viral | Complete AI Video Platform",
  description: "We analyze what's working for your competitors, clone your voice and face, then create viral content that dominates your niche. Start free today.",
  keywords: "AI video generator, content creation, social media automation, video cloning, voice cloning, viral content, competitor analysis",
  authors: [{ name: "SocialGenie" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "SocialGenie - Your Partner to Go Viral",
    description: "We spy on your competitors. Then make you better. AI-powered viral video generation.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialGenie - Your Partner to Go Viral",
    description: "We spy on your competitors. Then make you better. AI-powered viral video generation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden min-w-0`}>
        <Providers>
          <PreconnectLinks />
          <RouteChangeProgress />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
