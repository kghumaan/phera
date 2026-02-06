'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { weddingService, Wedding, WeddingEvent, WeddingSettings } from '@/lib/supabase/wedding-service';

interface WeddingContextType {
  wedding: Wedding | null;
  events: WeddingEvent[];
  settings: WeddingSettings | null;
  isLoading: boolean;
  error: string | null;
  refetchWedding: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

interface WeddingProviderProps {
  children: ReactNode;
  weddingSlug: string;
}

export function WeddingProvider({ children, weddingSlug }: WeddingProviderProps) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Helper function to add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  };

  const fetchWeddingData = async (isRetry: boolean = false) => {
    try {
      setIsLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      console.log(`🔄 Fetching wedding data (attempt ${retryCount + 1})...`);

      // Fetch wedding by slug with timeout
      const weddingData = await withTimeout(
        weddingService.getWeddingBySlug(weddingSlug),
        10000 // 10 second timeout
      );

      if (!weddingData) {
        setError('Wedding not found');
        setIsLoading(false);
        return;
      }

      console.log('✅ Wedding data loaded successfully');
      setWedding(weddingData);

      // Fetch related data in parallel with timeout
      const [eventsData, settingsData] = await withTimeout(
        Promise.all([
          weddingService.getWeddingEvents(weddingData.id),
          weddingService.getSettings(weddingData.id),
        ]),
        10000 // 10 second timeout
      );

      setEvents(eventsData || []);
      setSettings(settingsData);
      setIsLoading(false); // Ensure loading is set to false after parallel fetch
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('❌ Error fetching wedding data:', err);

      // Retry logic: retry up to 2 times
      if (retryCount < 2) {
        console.log(`🔄 Retrying in 2 seconds... (attempt ${retryCount + 2}/3)`);
        setRetryCount(retryCount + 1);
        setTimeout(() => {
          fetchWeddingData(true);
        }, 2000);
        return;
      }

      setError('Failed to load wedding data. Please refresh the page.');
    } finally {
      // Only set loading to false if we're not going to retry
      if (retryCount >= 2) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (weddingSlug) {
      fetchWeddingData();
    }
  }, [weddingSlug]);

  const refetchWedding = async () => {
    await fetchWeddingData();
  };

  const value: WeddingContextType = {
    wedding,
    events,
    settings,
    isLoading,
    error,
    refetchWedding,
  };

  return (
    <WeddingContext.Provider value={value}>
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const context = useContext(WeddingContext);
  if (context === undefined) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
}

