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
  isCheckingRSVP: boolean;
  checkRSVPStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRSVPed, setHasRSVPed] = useState(false);
  const [isCheckingRSVP, setIsCheckingRSVP] = useState(false);

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
    if (!user || isCheckingRSVP || !user.email) {
      return;
    }

    setIsCheckingRSVP(true);
    setHasRSVPed(false); // Reset state first
    
    try {
      // First, let's try a direct RSVP query to see if the user has any RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select(`
          id,
          attending,
          event_id,
          guest_id,
          guests (
            id,
            email,
            name
          )
        `)
        .eq('wedding_id', 'sim-kv');

      console.log('All RSVPs in database:', rsvpData);

      // Now check specifically for this user's RSVPs using the guest relationship
      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          email,
          name,
          rsvps (
            id,
            attending,
            event_id
          )
        `)
        .eq('email', user.email)
        .eq('wedding_id', 'sim-kv')
        .single();

      console.log('Guest query result:', { data, error, userEmail: user.email });

      if (error) {
        console.error('Error in guest query:', error);
        
        // If guest not found, maybe check by guest ID directly
        if (user.id && user.id !== 'temp-guest') {
          const { data: directRSVPData, error: directError } = await supabase
            .from('rsvps')
            .select('*')
            .eq('guest_id', user.id)
            .eq('wedding_id', 'sim-kv');
          
          console.log('Direct RSVP query by guest_id:', { directRSVPData, directError });
          
          if (directRSVPData && directRSVPData.length > 0) {
            setHasRSVPed(true);
            return;
          }
        }
        
        setHasRSVPed(false);
        return;
      }

      if (!data) {
        setHasRSVPed(false);
        return;
      }

      // Check if user has any RSVP records (including both attending and not attending)
      const hasAnyRSVP = data.rsvps && data.rsvps.length > 0;
      setHasRSVPed(hasAnyRSVP);
      
      // Log for debugging
      console.log('RSVP Status Check:', {
        user: user.email,
        hasRSVPs: hasAnyRSVP,
        rsvps: data.rsvps,
        guestData: data
      });
    } catch (error) {
      console.error('Error checking RSVP status:', error);
      setHasRSVPed(false);
    } finally {
      setIsCheckingRSVP(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // First check for Supabase auth
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
        // Check for guest authentication (after RSVP)
        if (typeof window !== 'undefined') {
          const guestAuthData = localStorage.getItem('phera_guest_auth');
          if (guestAuthData) {
            try {
              const guestInfo = JSON.parse(guestAuthData);
              // Check if the authentication is recent (within 24 hours)
              const isRecent = Date.now() - guestInfo.timestamp < 24 * 60 * 60 * 1000;
              if (isRecent && guestInfo.email) {
                const userData: User = {
                  id: guestInfo.id,
                  email: guestInfo.email,
                  name: guestInfo.name,
                  phone: guestInfo.phone,
                  initials: generateInitials(guestInfo.name),
                  avatar_color: generateAvatarColor(guestInfo.name),
                };
                setUser(userData);
              } else {
                // Remove expired guest auth
                localStorage.removeItem('phera_guest_auth');
                setUser(null);
              }
            } catch (error) {
              console.error('Error parsing guest auth data:', error);
              localStorage.removeItem('phera_guest_auth');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
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
      // Also clear guest authentication
      if (typeof window !== 'undefined') {
        localStorage.removeItem('phera_guest_auth');
      }
      setUser(null);
      setHasRSVPed(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted) {
        await checkAuthStatus();
      }
    };
    
    initAuth().catch(console.error);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          if (event === 'SIGNED_IN' && session) {
            await checkAuthStatus();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setHasRSVPed(false);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !isLoading) {
      // Add a small delay to ensure database is consistent
      const timer = setTimeout(() => {
        checkRSVPStatus();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setHasRSVPed(false);
      setIsCheckingRSVP(false);
    }
  }, [user?.id, isLoading]); // Use user.id instead of user object to prevent unnecessary re-renders

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        hasRSVPed, 
        isCheckingRSVP,
        checkRSVPStatus, 
        signOut,
        refreshAuth: checkAuthStatus
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