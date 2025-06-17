import type { Metadata } from "next";
import { Work_Sans, Instrument_Serif } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ClientThemeProvider } from '@/components/shared/ThemeProvider';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
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
  title: "Phera - Indian Wedding Platform",
  description: "Celebrate love with traditional Indian wedding ceremonies",
  icons: {
    icon: '/logo-flower.svg',
    shortcut: '/logo-flower.svg',
    apple: '/logo-flower.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.variable} ${instrumentSerif.variable} antialiased`}>
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
