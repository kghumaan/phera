'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  weddingService,
  WeddingService,
  Wedding,
  WeddingEvent,
  WeddingSettings,
  WeddingFAQ,
  WeddingTravelCard,
  WeddingRegistry,
  WeddingShop,
  WeddingSchedule,
  ScheduleItem,
} from '@/lib/supabase/wedding-service';
import { getPublicSupabaseClient } from '@/lib/supabase/client';

interface WeddingContextType {
  wedding: Wedding | null;
  events: WeddingEvent[];
  settings: WeddingSettings | null;
  faqs: WeddingFAQ[];
  schedule: Array<WeddingSchedule & { events: ScheduleItem[] }>;
  travelCards: WeddingTravelCard[];
  registry: WeddingRegistry[];
  shops: WeddingShop[];
  isLoading: boolean;
  error: string | null;
  refetchWedding: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

interface WeddingProviderProps {
  children: ReactNode;
  weddingSlug: string;
  mode?: 'preview' | 'live';
}

export function WeddingProvider({ children, weddingSlug, mode = 'preview' }: WeddingProviderProps) {
  // Use public client for live (guest-facing) mode only; preview uses authenticated client
  const service = useMemo(() =>
    mode === 'live'
      ? new WeddingService(getPublicSupabaseClient())
      : weddingService,
    [mode]
  );
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [faqs, setFaqs] = useState<WeddingFAQ[]>([]);
  const [schedule, setSchedule] = useState<Array<WeddingSchedule & { events: ScheduleItem[] }>>([]);
  const [travelCards, setTravelCards] = useState<WeddingTravelCard[]>([]);
  const [registry, setRegistry] = useState<WeddingRegistry[]>([]);
  const [shops, setShops] = useState<WeddingShop[]>([]);
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
        service.getWeddingBySlug(weddingSlug),
        10000
      );

      if (!weddingData) {
        setError('Wedding not found');
        setIsLoading(false);
        return;
      }

      // In live mode, read from published_snapshot if available
      if (mode === 'live' && weddingData.published_snapshot) {
        console.log('✅ Loading from published snapshot');
        const snapshot = weddingData.published_snapshot as any;
        setWedding(snapshot.wedding || weddingData);
        setEvents(snapshot.events || []);
        setSettings(snapshot.settings || null);
        setFaqs(snapshot.faqs || []);
        setSchedule([...(snapshot.schedule || [])].sort((a: any, b: any) => (a.date ?? '').localeCompare(b.date ?? '')));
        setTravelCards(snapshot.travelCards || []);
        setRegistry(snapshot.registry || []);
        setShops(snapshot.shops || []);
        setIsLoading(false);
        setRetryCount(0);
        return;
      }

      // Fallback: read from DB tables (preview mode, or live with no snapshot)
      console.log('✅ Wedding data loaded successfully');
      setWedding(weddingData);

      // Fetch all related data in parallel with timeout
      const [eventsData, settingsData, faqsData, scheduleData, travelData, registryData, shopsData] = await withTimeout(
        Promise.all([
          service.getWeddingEvents(weddingData.id),
          service.getSettings(weddingData.id),
          service.getFAQs(weddingData.id),
          service.getWeddingSchedule(weddingData.id),
          service.getTravelCards(weddingData.id),
          service.getRegistry(weddingData.id),
          service.getShops(weddingData.id),
        ]),
        10000
      );

      setEvents(eventsData || []);
      setSettings(settingsData);
      setFaqs(faqsData || []);
      setSchedule(scheduleData || []);
      setTravelCards(travelData || []);
      setRegistry(registryData || []);
      setShops(shopsData || []);
      setIsLoading(false);
      setRetryCount(0);
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

    // Real-time Design Sync Listener (only for preview mode)
    if (mode === 'preview') {
      const channel = new BroadcastChannel('phera-design-sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'DESIGN_UPDATE' && event.data?.updates) {
          console.log('📥 Received design update:', event.data.updates);
          setWedding(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...event.data.updates
            };
          });
        }
        if (event.data?.type === 'PREVIEW_REFRESH') {
          console.log('📥 Received preview refresh signal');
          fetchWeddingData();
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [weddingSlug, mode]);

  const refetchWedding = async () => {
    await fetchWeddingData();
  };

  const value: WeddingContextType = {
    wedding,
    events,
    settings,
    faqs,
    schedule,
    travelCards,
    registry,
    shops,
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
