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

  const fetchWeddingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch wedding by slug
      const weddingData = await weddingService.getWeddingBySlug(weddingSlug);
      
      if (!weddingData) {
        setError('Wedding not found');
        setIsLoading(false);
        return;
      }

      setWedding(weddingData);

      // Fetch related data in parallel
      const [eventsData, settingsData] = await Promise.all([
        weddingService.getWeddingEvents(weddingData.id),
        weddingService.getSettings(weddingData.id),
      ]);

      setEvents(eventsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error fetching wedding data:', err);
      setError('Failed to load wedding data');
    } finally {
      setIsLoading(false);
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

