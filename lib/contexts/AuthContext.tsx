'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/supabase/auth-service';
import { supabase } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  initials: string;
  avatar_color: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasRSVPed: boolean;
  checkRSVPStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRSVPed, setHasRSVPed] = useState(false);

  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const generateAvatarColor = (name: string): string => {
    const colors = [
      '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
      '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
      '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const checkRSVPStatus = async () => {
    if (!user) {
      setHasRSVPed(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          rsvps (
            id,
            attending
          )
        `)
        .eq('email', user.email)
        .eq('wedding_id', 'sim-kv')
        .single();

      if (error || !data) {
        setHasRSVPed(false);
        return;
      }

      // Check if user has any RSVP records
      setHasRSVPed(data.rsvps && data.rsvps.length > 0);
    } catch (error) {
      console.error('Error checking RSVP status:', error);
      setHasRSVPed(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success && result.user) {
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phone: result.user.phone,
          initials: generateInitials(result.user.name),
          avatar_color: generateAvatarColor(result.user.name),
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setHasRSVPed(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkAuthStatus();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setHasRSVPed(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      checkRSVPStatus();
    }
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        hasRSVPed, 
        checkRSVPStatus, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 