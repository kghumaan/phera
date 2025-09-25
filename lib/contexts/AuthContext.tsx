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
  avatar_style?: string;
  avatar_seed?: string;
  avatar_svg?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasRSVPed: boolean;
  rsvpResponse: 'yes' | 'no' | 'maybe' | null;
  isCheckingRSVP: boolean;
  checkRSVPStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  handlePlusOneAuth: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRSVPed, setHasRSVPed] = useState(false);
  const [rsvpResponse, setRsvpResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [isCheckingRSVP, setIsCheckingRSVP] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setRsvpResponse(null); // Reset RSVP response
    
    try {
      // Check for bypass RSVP flag first - if set, skip all database checks
      if (typeof window !== 'undefined') {
        const bypassFlag = localStorage.getItem('phera_bypass_rsvp');
        if (bypassFlag === 'true') {
          console.log('Bypass RSVP flag detected - setting hasRSVPed to true without database check');
          setHasRSVPed(true);
          setRsvpResponse('yes'); // Set to 'yes' to simulate attending
          setIsCheckingRSVP(false);
          return;
        }
      }
      // Check if this is a plus one authentication (ID starts with "plus-one-")
      const isPlusOne = user.id?.startsWith('plus-one-');
      
      if (isPlusOne) {
        // For plus ones, check the RSVP by plus_one_email
        const { data: rsvpData, error: rsvpError } = await supabase
          .from('rsvps')
          .select(`
            id,
            attending,
            event_id,
            guest_id,
            plus_one_email,
            guests (
              id,
              email,
              name
            )
          `)
          .eq('plus_one_email', user.email.toLowerCase())
          .eq('wedding_id', 'sim-kv')
          .single();

        console.log('Plus one RSVP query result:', { rsvpData, rsvpError, userEmail: user.email });

        if (rsvpError) {
          console.error('Error in plus one RSVP query:', rsvpError);
          setHasRSVPed(false);
          setRsvpResponse(null);
          return;
        }

        if (rsvpData) {
          setHasRSVPed(true);
          setRsvpResponse(rsvpData.attending);
          console.log('Plus one RSVP Status:', {
            user: user.email,
            hasRSVP: true,
            rsvpResponse: rsvpData.attending,
            rsvpData: rsvpData
          });
          return;
        }
      } else {
        // For main guests, use the existing logic
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
          .eq('email', user.email.toLowerCase())
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
              setRsvpResponse(directRSVPData[0].attending);
              return;
            }
          }
          
          setHasRSVPed(false);
          setRsvpResponse(null);
          return;
        }

        if (!data) {
          setHasRSVPed(false);
          setRsvpResponse(null);
          return;
        }

        // Check if user has any RSVP records (including both attending and not attending)
        const hasAnyRSVP = data.rsvps && data.rsvps.length > 0;
        setHasRSVPed(hasAnyRSVP);
        
        // Set RSVP response if available
        if (hasAnyRSVP && data.rsvps[0]) {
          setRsvpResponse(data.rsvps[0].attending);
        } else {
          setRsvpResponse(null);
        }
        
        // Log for debugging
        console.log('RSVP Status Check:', {
          user: user.email,
          hasRSVPs: hasAnyRSVP,
          rsvpResponse: data.rsvps[0]?.attending,
          rsvps: data.rsvps,
          guestData: data
        });
      }
    } catch (error) {
      console.error('Error checking RSVP status:', error);
      setHasRSVPed(false);
      setRsvpResponse(null);
    } finally {
      setIsCheckingRSVP(false);
    }
  };

  // Helper function to handle plus one authentication
  const handlePlusOneAuth = async (email: string) => {
    try {
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select(`
          id,
          plus_one_name,
          plus_one_email,
          guest_id,
          guests (
            id,
            name,
            email,
            phone,
            avatar_style,
            avatar_seed,
            avatar_svg
          )
        `)
        .eq('plus_one_email', email.toLowerCase())
        .eq('wedding_id', 'sim-kv')
        .single();

      if (rsvpData && rsvpData.plus_one_email) {
        // Create virtual guest authentication for plus one
        const guestInfo = {
          id: `plus-one-${rsvpData.guest_id}`,
          email: rsvpData.plus_one_email,
          name: rsvpData.plus_one_name || 'Plus One',
          phone: undefined,
          weddingId: 'sim-kv',
          avatar_style: undefined,
          avatar_seed: undefined,
          avatar_svg: undefined,
          timestamp: Date.now()
        };

        // Store in localStorage for future authentication
        localStorage.setItem('phera_guest_auth', JSON.stringify(guestInfo));

        const userData: User = {
          id: guestInfo.id,
          email: guestInfo.email,
          name: guestInfo.name,
          phone: guestInfo.phone,
          initials: generateInitials(guestInfo.name),
          avatar_color: generateAvatarColor(guestInfo.name),
          avatar_style: guestInfo.avatar_style,
          avatar_seed: guestInfo.avatar_seed,
          avatar_svg: guestInfo.avatar_svg,
        };
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error handling plus one authentication:', error);
      return false;
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
          avatar_style: result.user.avatar_style,
          avatar_seed: result.user.avatar_seed,
          avatar_svg: result.user.avatar_svg,
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
              if (isRecent && guestInfo.email && (guestInfo.id !== 'temp-guest' || guestInfo.id === 'temp-bypass-guest')) {
                // Check if this is a plus one authentication or bypass guest
                const isPlusOne = guestInfo.id?.startsWith('plus-one-');
                const isBypassGuest = guestInfo.id === 'temp-bypass-guest';
                
                if (isPlusOne || isBypassGuest) {
                  // For plus ones, we don't need to fetch avatar data from guests table
                  // since they don't have entries there
                  const userData: User = {
                    id: guestInfo.id,
                    email: guestInfo.email,
                    name: guestInfo.name,
                    phone: guestInfo.phone,
                    initials: generateInitials(guestInfo.name),
                    avatar_color: generateAvatarColor(guestInfo.name),
                    avatar_style: guestInfo.avatar_style,
                    avatar_seed: guestInfo.avatar_seed,
                    avatar_svg: guestInfo.avatar_svg,
                  };
                  setUser(userData);
                } else {
                  // For main guests, handle avatar data fetching as before
                  if (!guestInfo.avatar_svg && guestInfo.email) {
                    console.log('Avatar data missing in localStorage, fetching from database...');
                    try {
                      const { data: guestData } = await supabase
                        .from('guests')
                        .select('avatar_style, avatar_seed, avatar_svg')
                        .eq('email', guestInfo.email.toLowerCase())
                        .eq('wedding_id', 'sim-kv')
                        .single();
                      
                      if (guestData) {
                        // Update localStorage with complete data
                        const updatedGuestInfo = {
                          ...guestInfo,
                          avatar_style: guestData.avatar_style,
                          avatar_seed: guestData.avatar_seed,
                          avatar_svg: guestData.avatar_svg,
                        };
                        localStorage.setItem('phera_guest_auth', JSON.stringify(updatedGuestInfo));
                        guestInfo.avatar_style = guestData.avatar_style;
                        guestInfo.avatar_seed = guestData.avatar_seed;
                        guestInfo.avatar_svg = guestData.avatar_svg;
                      }
                    } catch (error) {
                      console.error('Error fetching avatar data:', error);
                    }
                  }
                  
                  const userData: User = {
                    id: guestInfo.id,
                    email: guestInfo.email,
                    name: guestInfo.name,
                    phone: guestInfo.phone,
                    initials: generateInitials(guestInfo.name),
                    avatar_color: generateAvatarColor(guestInfo.name),
                    avatar_style: guestInfo.avatar_style,
                    avatar_seed: guestInfo.avatar_seed,
                    avatar_svg: guestInfo.avatar_svg,
                  };
                  setUser(userData);
                }
              } else {
                // Remove expired or temp guest auth
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
      // Also clear guest authentication and pin verification
      if (typeof window !== 'undefined') {
        localStorage.removeItem('phera_guest_auth');
        localStorage.removeItem('phera_pin_verified');
        localStorage.removeItem('phera_pin_timestamp');
        localStorage.removeItem('phera_allows_plus_one');
        localStorage.removeItem('phera_bypass_rsvp');
      }
      setUser(null);
      setHasRSVPed(false);
      setRsvpResponse(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshAuth = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      return; // Silently skip without logging
    }

    console.log('Refreshing auth status');
    setIsRefreshing(true);
    setIsLoading(true);
    
    // Add timeout protection for refresh
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('RefreshAuth timed out, forcing completion');
        setIsLoading(false);
        setIsRefreshing(false);
        resolve();
      }, 8000); // 8 second timeout for refresh
    });
    
    // Add retry logic for auth check after magic link
    const authCheckWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        console.log(`Auth check attempt ${i + 1} of ${retries}`);
        
        try {
          // First, refresh the session to ensure it's valid
          console.log('Refreshing Supabase session...');
          const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
          console.log('Session refresh result:', { sessionData: sessionData?.session?.user?.email, sessionError });
          
          // Check if we have a Supabase session directly
          const { data: { user: sessionUser }, error } = await supabase.auth.getUser();
          
          if (sessionUser) {
            console.log('Found valid session for:', sessionUser.email);
            await checkAuthStatus();
            return;
          } else if (i < retries - 1) {
            console.log('No session found, retrying...', error);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          } else {
            console.log('All auth check attempts failed');
            
            // FALLBACK: Check for magic link parameters without session
            // This handles cases like local testing or session expiry
            const urlParams = new URLSearchParams(window.location.search);
            const authSuccess = urlParams.get('auth_success');
            const userEmail = urlParams.get('user_email');
            
            if (authSuccess === 'true' && userEmail) {
              console.log('Magic link detected without session, attempting guest auth fallback for:', decodeURIComponent(userEmail));
              
              // Try guest authentication with the email from URL params
              const guestEmail = decodeURIComponent(userEmail);
              
              // Check for existing guest data directly
              const { data: guestData } = await supabase
                .from('guests')
                .select('id, name, email, phone, avatar_style, avatar_seed, avatar_svg')
                .eq('email', guestEmail.toLowerCase())
                .eq('wedding_id', 'sim-kv')
                .single();
              
              if (guestData) {
                console.log('Found guest data for fallback auth:', guestData.name);
                
                const fallbackUser: User = {
                  id: guestData.id,
                  email: guestData.email,
                  name: guestData.name,
                  phone: guestData.phone,
                  initials: generateInitials(guestData.name),
                  avatar_color: generateAvatarColor(guestData.name),
                  avatar_style: guestData.avatar_style,
                  avatar_seed: guestData.avatar_seed,
                  avatar_svg: guestData.avatar_svg,
                };
                
                setUser(fallbackUser);
                console.log('Fallback authentication successful');
                return;
              } else {
                console.log('No guest data found for fallback auth');
              }
            }
          }
        } catch (err) {
          console.error(`Auth check attempt ${i + 1} failed:`, err);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          }
        }
      }
    };
    
    // Race between auth check with retry and timeout
    try {
      await Promise.race([authCheckWithRetry(), timeoutPromise]);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false); // Ensure loading state is always cleared
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
            console.log('Auth state changed to SIGNED_IN, refreshing auth status');
            await checkAuthStatus();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setHasRSVPed(false);
            setRsvpResponse(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    // Also listen for storage events to handle cross-tab auth changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'phera_guest_auth' && mounted) {
        console.log('Guest auth changed in storage, refreshing auth status');
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timed out, forcing completion');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(safetyTimeout);
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
      setRsvpResponse(null);
      setIsCheckingRSVP(false);
    }
  }, [user?.id, isLoading]); // Use user.id instead of user object to prevent unnecessary re-renders

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        hasRSVPed, 
        rsvpResponse,
        isCheckingRSVP,
        checkRSVPStatus, 
        signOut,
        refreshAuth,
        handlePlusOneAuth
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