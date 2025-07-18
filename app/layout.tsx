import type { Metadata } from "next";
import { Outfit, Instrument_Serif } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ClientThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Sim & KV's Wedding Invite",
  description: "RSVP for Sim &amp; KV's wedding celebrations in Thailand. All travel and event details are now available on our website.",
  
  // Open Graph tags for rich link previews - Optimized for large rectangular format
  openGraph: {
    title: "Sim & KV's Wedding Invite",
    description: "RSVP for Sim &amp; KV's wedding celebrations in Thailand. All travel and event details are now available on our website.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io",
    siteName: "Phera",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io"}/images/couple/imessage-optimized.jpg`,
        width: 1200,
        height: 630,
        alt: "Sim & KV - Wedding Celebration",
        type: "image/jpeg",
      },
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io"}/images/couple/whatsapp-square.jpg`,
        width: 1200,
        height: 1200,
        alt: "Sim & KV - Wedding Celebration",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
  },
  
  // Twitter Card tags - Using large image format for maximum impact
  twitter: {
    card: "summary_large_image",
    title: "Sim & KV's Wedding Invite",
    description: "RSVP for Sim &amp; KV's wedding celebrations in Thailand. All travel and event details are now available on our website.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io"}/images/couple/imessage-optimized.jpg`],
    creator: "@phera",
  },
  
  // Additional metadata
  keywords: ["wedding", "indian wedding", "invitation", "RSVP", "celebration", "Sim", "KV"],
  authors: [{ name: "Sim & KV" }],
  creator: "Sim & KV",
  publisher: "Phera",
  
  // Icons - using lotus-flame logo
  icons: {
    icon: [
      { url: '/logo-lotus-flame.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/logo-lotus-flame.svg',
    apple: '/logo-lotus-flame.svg',
  },
  
  // Manifest
  manifest: '/manifest.json',
  
  // Viewport
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  
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
    'og:image:alt': 'Sim & KV - Wedding Celebration',
    'og:image:secure_url': `${process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io"}/images/couple/imessage-optimized.jpg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${instrumentSerif.variable} antialiased`}>
        <ErrorBoundary>
          <AppRouterCacheProvider>
            <ClientThemeProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ClientThemeProvider>
          </AppRouterCacheProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
