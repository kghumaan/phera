'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

export type PlanType = 'phera' | 'phera_premium' | 'phera_grand' | 'planner';

interface PlanContextType {
  plan: PlanType;
  isLoading: boolean;
  isPro: boolean;
  isPlanner: boolean;
  togglePlan: () => Promise<void>;
  setPlan: (plan: PlanType) => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlanState] = useState<PlanType>('phera');
  const [isLoading, setIsLoading] = useState(true);

  // Load user's plan from Supabase
  const loadPlan = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // First try to get existing user_settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine for new users
        console.error('Error loading plan:', error);
      }

      if (data?.subscription_tier) {
        setPlanState(data.subscription_tier as PlanType);
      } else {
        // Default to basic for new users
        setPlanState('phera');
      }
    } catch (err) {
      console.error('Error loading plan:', err);
      setPlanState('phera');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const setPlan = useCallback(async (newPlan: PlanType) => {
    if (!user?.id) return;

    try {
      // Upsert the user_settings record
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            subscription_tier: newPlan,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('Error saving plan:', error);
        return;
      }

      setPlanState(newPlan);
    } catch (err) {
      console.error('Error saving plan:', err);
    }
  }, [user?.id]);

  const togglePlan = useCallback(async () => {
    const newPlan = plan === 'phera' ? 'phera_premium' : 'phera';
    await setPlan(newPlan);
  }, [plan, setPlan]);

  return (
    <PlanContext.Provider
      value={{
        plan,
        isLoading,
        isPro: plan !== 'phera', // 'phera' = basic/free, anything else = Pro
        isPlanner: plan === 'planner',
        togglePlan,
        setPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
