import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Instrument_Serif, Ballet, Tenor_Sans, Petit_Formal_Script, Forum, Cormorant } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ClientThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { PlanProvider } from '@/lib/contexts/PlanContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: 'swap',
});

const ballet = Ballet({
  variable: "--font-ballet",
  subsets: ["latin"],
  weight: ["400"],
  display: 'swap',
});

const tenorSans = Tenor_Sans({
  variable: "--font-tenor-sans",
  subsets: ["latin"],
  weight: ["400"],
  display: 'swap',
});

const petitFormalScript = Petit_Formal_Script({
  variable: "--font-petit-formal-script",
  subsets: ["latin"],
  weight: ["400"],
  display: 'swap',
});

const forum = Forum({
  variable: "--font-forum",
  subsets: ["latin"],
  weight: ["400"],
  display: 'swap',
});

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["600"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.phera.io"),
  title: {
    default: "Phera | Indian Wedding Planning Platform",
    template: "%s | Phera"
  },
  description: "The modern Indian wedding platform. Manage RSVPs, coordinate travel, share events, and create beautiful wedding websites. Start free, add smart AI agents when you need them.",

  // Open Graph tags for rich link previews - Optimized for large rectangular format
  openGraph: {
    title: "Phera | Indian Wedding Planning Platform",
    description: "The modern Indian wedding platform. Manage RSVPs, coordinate travel, share events, and create beautiful wedding websites. Start free, add smart AI agents when you need them.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.phera.io",
    siteName: "Phera",
    images: [
      {
        url: "/images/couple/imessage-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "Phera - Indian Wedding Platform",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
  },

  // Twitter Card tags - Using large image format for maximum impact
  twitter: {
    card: "summary_large_image",
    title: "Phera | Indian Wedding Planning Platform",
    description: "The modern Indian wedding platform. Manage RSVPs, coordinate travel, share events, and create beautiful wedding websites. Start free, add smart AI agents when you need them.",
    images: ["/images/couple/imessage-optimized.jpg"],
    creator: "@phera",
  },

  // Additional metadata
  keywords: ["indian wedding", "wedding platform", "wedding website", "RSVP", "wedding planning", "destination wedding", "wedding management"],
  authors: [{ name: "Phera" }],
  creator: "Phera",
  publisher: "Phera",

  // Icons — white lotus-flame on a #1a1a1a tile. The bare logo-lotus-flame.svg
  // is white-on-transparent, which disappears against a light browser tab.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Manifest
  manifest: '/manifest.json',

  // Additional meta tags optimized for link sharing, including WhatsApp
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Phera',
    'theme-color': '#D4AF37',

    // Enhanced meta tags for better link previews
    'og:image:type': 'image/jpeg',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': 'Phera - Indian Wedding Platform',
    'og:image:secure_url': `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.phera.io"}/images/couple/imessage-optimized.jpg`,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Phera",
    "url": "https://www.phera.io",
    "logo": "https://www.phera.io/logo.svg",
    "sameAs": [
      "https://instagram.com/withphera",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@phera.io",
      "contactType": "customer support",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/mcp/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className={`${outfit.variable} ${instrumentSerif.variable} ${ballet.variable} ${tenorSans.variable} ${petitFormalScript.variable} ${forum.variable} ${cormorant.variable} antialiased`}>
        <ErrorBoundary>
          <AppRouterCacheProvider>
            <ClientThemeProvider>
              <AuthProvider>
                <PlanProvider>
                  {children}
                </PlanProvider>
              </AuthProvider>
            </ClientThemeProvider>
          </AppRouterCacheProvider>
          <Toaster richColors position="bottom-right" />
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
