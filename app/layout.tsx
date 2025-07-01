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
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Sim & KV's Wedding Invite - Phera",
  description: "Join us for our traditional Indian wedding celebration. RSVP and share in our joyous moments as we begin our journey together.",
  
  // Open Graph tags for rich link previews
  openGraph: {
    title: "Sim & KV's Wedding Invite - Phera",
    description: "Join us for our traditional Indian wedding celebration. RSVP and share in our joyous moments as we begin our journey together.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://phera.app",
    siteName: "Phera",
    images: [
      {
        url: "/images/couple/couple-1-og.jpg",
        width: 1200,
        height: 1200,
        alt: "Sim & KV - Wedding Couple",
      },
    ],
    locale: "en_US",
  },
  
  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    title: "Sim & KV's Wedding Invite - Phera",
    description: "Join us for our traditional Indian wedding celebration. RSVP and share in our joyous moments as we begin our journey together.",
    images: ["/images/couple/couple-1-og.jpg"],
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
  
  // Additional meta tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Phera',
    'theme-color': '#D4AF37',
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
