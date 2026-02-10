'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getCurrentUser } from '@/lib/supabase/auth-service';
import { supabase } from '@/lib/supabase/client';
import { isOnLandingPage } from '@/lib/utils/wedding-id-helpers';

// Helper to detect public routes where auth check should be skipped
// This prevents AbortError from Supabase's lock mechanism on pages without sessions
function isPublicRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const publicPaths = ['/', '/auth/signup', '/auth/login', '/auth/callback'];
  return publicPaths.some(p => path === p) || path.startsWith('/auth/');
}

interface User {
  id: string; // auth.users.id - used for admin checks
  guestId?: string | null; // guests.id - used for guest-specific operations
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
  isAdmin: boolean;
  adminWeddingSlug: string | null;
  currentWeddingSlug: string | null;
  setCurrentWeddingSlug: (slug: string) => void;
  checkRSVPStatus: (force?: boolean) => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminWeddingSlug, setAdminWeddingSlug] = useState<string | null>(null);
  const [currentWeddingSlug, setCurrentWeddingSlugState] = useState<string | null>(null);
  const isCheckingAuthRef = useRef(false);
  const hasCheckedAdminRef = useRef(false);
  const lastCheckedWeddingSlug = useRef<string | null>(null);

  // Set the current wedding slug and trigger RSVP recheck if changed
  const setCurrentWeddingSlug = React.useCallback((slug: string) => {
    if (slug && slug !== currentWeddingSlug) {
      console.log('🔄 [AuthContext] Wedding slug changed:', currentWeddingSlug, '->', slug);
      setCurrentWeddingSlugState(slug);
      // Reset RSVP state when wedding changes
      setHasRSVPed(false);
      setRsvpResponse(null);
    }
  }, [currentWeddingSlug]);

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

  // Check if user is admin of any wedding (only runs once per session)
  const checkAdminStatus = async (userId: string) => {
    // Skip if already checked for this user
    if (hasCheckedAdminRef.current) {
      return;
    }

    console.log('🔍 [AuthContext] Checking admin status for user:', userId);
    hasCheckedAdminRef.current = true;

    try {
      // First check if user created any weddings
      const { data: createdWeddings, error: createdError } = await supabase
        .from('weddings')
        .select('slug')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (createdWeddings && createdWeddings.length > 0) {
        console.log('✅ [AuthContext] User created wedding:', (createdWeddings[0] as any).slug);
        setIsAdmin(true);
        setAdminWeddingSlug((createdWeddings[0] as any).slug);
        return;
      }

      // Then check if user is an admin of any wedding
      const { data: adminWeddings, error: adminError } = await supabase
        .from('wedding_admins' as any)
        .select('wedding_id, weddings(slug)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (adminWeddings && adminWeddings.length > 0 && (adminWeddings[0] as any).weddings) {
        const weddingSlug = (adminWeddings[0] as any).weddings.slug;
        console.log('✅ [AuthContext] User is admin of wedding:', weddingSlug);
        setIsAdmin(true);
        setAdminWeddingSlug(weddingSlug);
      } else {
        console.log('ℹ️ [AuthContext] User is not an admin of any wedding');
        setIsAdmin(false);
        setAdminWeddingSlug(null);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error checking admin status:', error);
      setIsAdmin(false);
      setAdminWeddingSlug(null);
    }
  };

  const checkRSVPStatus = React.useCallback(async (force: boolean = false) => {
    if (!user || isCheckingRSVP || !user.email) {
      return;
    }

    // Skip RSVP checks if no wedding slug is set
    if (!currentWeddingSlug) {
      console.log('Skipping RSVP check - no wedding slug set');
      setIsCheckingRSVP(false);
      return;
    }

    // Skip if we already checked this wedding, unless forcing a refresh
    if (!force && lastCheckedWeddingSlug.current === currentWeddingSlug && (hasRSVPed || rsvpResponse !== null)) {
      console.log('Skipping RSVP check - already checked for this wedding');
      return;
    }

    // Skip RSVP checks for landing page
    if (typeof window !== 'undefined' && isOnLandingPage()) {
      console.log('Skipping RSVP check for landing page');
      setIsCheckingRSVP(false);
      return;
    }

    // Skip RSVP checks for admin routes
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      console.log('Skipping RSVP check for admin route');
      setIsCheckingRSVP(false);
      return;
    }

    // Skip RSVP checks for onboarding route
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/onboarding')) {
      console.log('Skipping RSVP check for onboarding route');
      setIsCheckingRSVP(false);
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
          .eq('wedding_id', currentWeddingSlug)
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
          setRsvpResponse((rsvpData as any).attending);
          console.log('Plus one RSVP Status:', {
            user: user.email,
            hasRSVP: true,
            rsvpResponse: (rsvpData as any).attending,
            rsvpData: rsvpData
          });
          return;
        }
      } else {
        // For main guests, use the existing logic
        const { data: rsvpData, error: rsvpError } = await (supabase as any)
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
          .eq('wedding_id', currentWeddingSlug);

        console.log('All RSVPs in database:', rsvpData);

        const { data, error } = await (supabase as any)
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
          .eq('wedding_id', currentWeddingSlug)
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
              .eq('wedding_id', currentWeddingSlug);

            console.log('Direct RSVP query by guest_id:', { directRSVPData, directError });

            if (directRSVPData && directRSVPData.length > 0) {
              setHasRSVPed(true);
              setRsvpResponse(directRSVPData[0].attending as 'yes' | 'no' | 'maybe');
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
          setRsvpResponse(data.rsvps[0].attending as 'yes' | 'no' | 'maybe');
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
      lastCheckedWeddingSlug.current = currentWeddingSlug;
      setIsCheckingRSVP(false);
    }
  }, [user, isCheckingRSVP, currentWeddingSlug, hasRSVPed, rsvpResponse]);

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
        .eq('wedding_id', currentWeddingSlug || 'sim-kv')
        .single();

      if (rsvpData && rsvpData.plus_one_email) {
        // Create virtual guest authentication for plus one
        const guestInfo = {
          id: `plus-one-${rsvpData.guest_id}`,
          email: rsvpData.plus_one_email,
          name: rsvpData.plus_one_name || 'Plus One',
          phone: undefined,
          weddingId: currentWeddingSlug || 'sim-kv',
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

  const checkAuthStatus = React.useCallback(async () => {
    // Prevent multiple simultaneous auth checks using ref
    if (isCheckingAuthRef.current) {
      console.log('checkAuthStatus: Skipping - already checking');
      return;
    }

    console.log('checkAuthStatus: Starting auth check');
    isCheckingAuthRef.current = true;
    try {
      // Get the Supabase user once
      const { data: { user: sbUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        if (userError.name === 'AbortError') {
          console.log('checkAuthStatus: Auth check aborted');
          // Don't clear loading yet if it was just an abort, let another check handle it
          return;
        }
        console.error('checkAuthStatus: User check error:', userError);
      }

      if (sbUser) {
        console.log('checkAuthStatus: Found session for:', sbUser.email);

        let guestData = null;
        if (sbUser.email) {
          try {
            const { data: guest } = await (supabase as any)
              .from('guests')
              .select('id, name, email, phone, avatar_style, avatar_seed, avatar_svg')
              .eq('email', sbUser.email.toLowerCase())
              .eq('wedding_id', currentWeddingSlug || 'sim-kv')
              .single();
            guestData = guest;
          } catch (err) {
            console.error('checkAuthStatus: Error fetching guest data:', err);
          }
        }

        const userData: User = {
          id: sbUser.id,
          guestId: guestData?.id || null,
          email: sbUser.email || '',
          name: guestData?.name || sbUser.user_metadata?.full_name || sbUser.email || '',
          phone: guestData?.phone || sbUser.phone,
          initials: generateInitials(guestData?.name || sbUser.user_metadata?.full_name || sbUser.email || ''),
          avatar_color: generateAvatarColor(guestData?.name || sbUser.user_metadata?.full_name || sbUser.email || ''),
          avatar_style: guestData?.avatar_style,
          avatar_seed: guestData?.avatar_seed,
          avatar_svg: guestData?.avatar_svg,
        };

        setUser(userData);
        checkAdminStatus(sbUser.id);
      } else {
        // Fallback to guest authentication if no Supabase session
        if (typeof window !== 'undefined') {
          const guestAuthData = localStorage.getItem('phera_guest_auth');
          if (guestAuthData) {
            try {
              const guestInfo = JSON.parse(guestAuthData);
              const isRecent = Date.now() - guestInfo.timestamp < 24 * 60 * 60 * 1000;

              if (isRecent && guestInfo.email && (guestInfo.id !== 'temp-guest' || guestInfo.id === 'temp-bypass-guest')) {
                const isPlusOne = guestInfo.id?.startsWith('plus-one-');
                const isBypassGuest = guestInfo.id === 'temp-bypass-guest';

                if (isPlusOne || isBypassGuest) {
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
                  // Fetch updated guest data if missing
                  if (!guestInfo.avatar_svg && guestInfo.email) {
                    try {
                      const { data: guestData } = await supabase
                        .from('guests')
                        .select('avatar_style, avatar_seed, avatar_svg')
                        .eq('email', guestInfo.email.toLowerCase())
                        .eq('wedding_id', currentWeddingSlug || guestInfo.weddingId || 'sim-kv')
                        .single();

                      if (guestData) {
                        guestInfo.avatar_style = (guestData as any).avatar_style;
                        guestInfo.avatar_seed = (guestData as any).avatar_seed;
                        guestInfo.avatar_svg = (guestData as any).avatar_svg;
                        localStorage.setItem('phera_guest_auth', JSON.stringify({
                          ...guestInfo,
                          timestamp: Date.now() // Keep it fresh
                        }));
                      }
                    } catch (err) {
                      console.error('checkAuthStatus: Guest data fetch failed:', err);
                    }
                  }

                  setUser({
                    id: guestInfo.id,
                    email: guestInfo.email,
                    name: guestInfo.name,
                    phone: guestInfo.phone,
                    initials: generateInitials(guestInfo.name),
                    avatar_color: generateAvatarColor(guestInfo.name),
                    avatar_style: guestInfo.avatar_style,
                    avatar_seed: guestInfo.avatar_seed,
                    avatar_svg: guestInfo.avatar_svg,
                  });
                }
              } else {
                localStorage.removeItem('phera_guest_auth');
                setUser(null);
              }
            } catch (err) {
              console.error('checkAuthStatus: Guest parse error:', err);
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
      console.error('checkAuthStatus: Critical error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      isCheckingAuthRef.current = false;
    }
  }, [currentWeddingSlug]);

  const signOut = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Also clear guest authentication and pin verification for current wedding
      if (typeof window !== 'undefined') {
        localStorage.removeItem('phera_guest_auth');
        // Clear per-wedding PIN verification if we know the current wedding
        if (currentWeddingSlug) {
          localStorage.removeItem(`phera_pin_verified_${currentWeddingSlug}`);
          localStorage.removeItem(`phera_pin_timestamp_${currentWeddingSlug}`);
          localStorage.removeItem(`phera_allows_plus_one_${currentWeddingSlug}`);
          localStorage.removeItem(`phera_bypass_rsvp_${currentWeddingSlug}`);
          localStorage.removeItem(`phera_skip_rsvp_${currentWeddingSlug}`);
          localStorage.removeItem(`phera_pin_type_${currentWeddingSlug}`);
        }
      }
      setUser(null);
      setHasRSVPed(false);
      setRsvpResponse(null);
      // Reset admin status
      setIsAdmin(false);
      setAdminWeddingSlug(null);
      hasCheckedAdminRef.current = false;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [currentWeddingSlug]);

  const refreshAuth = React.useCallback(async () => {
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
                .eq('wedding_id', currentWeddingSlug || 'sim-kv')
                .single();

              if (guestData) {
                console.log('Found guest data for fallback auth:', guestData.name);

                const fallbackUser: User = {
                  id: guestData.id,
                  email: guestData.email,
                  name: guestData.name,
                  phone: guestData.phone || undefined,
                  initials: generateInitials(guestData.name),
                  avatar_color: generateAvatarColor(guestData.name),
                  avatar_style: guestData.avatar_style || undefined,
                  avatar_seed: guestData.avatar_seed || undefined,
                  avatar_svg: guestData.avatar_svg || undefined,
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
  }, [isRefreshing, checkAuthStatus, currentWeddingSlug]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Skip auth check on public routes to prevent AbortError
      if (isPublicRoute()) {
        console.log('Skipping auth check on public route:', window.location.pathname);
        setIsLoading(false);
        return;
      }

      if (mounted) {
        await checkAuthStatus();
      }
    };

    initAuth().catch(console.error);

    // Listen for auth changes - SIMPLIFIED to avoid lock conflicts
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // Set user directly from session to avoid calling getUser() again
          // This prevents the AbortError lock conflict
          const sbUser = session.user;
          const userData: User = {
            id: sbUser.id,
            email: sbUser.email || '',
            name: sbUser.user_metadata?.full_name || sbUser.email || '',
            phone: sbUser.phone,
            initials: generateInitials(sbUser.user_metadata?.full_name || sbUser.email || ''),
            avatar_color: generateAvatarColor(sbUser.user_metadata?.full_name || sbUser.email || ''),
          };
          setUser(userData);
          setIsLoading(false);
          console.log('User set from SIGNED_IN event:', userData.email);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setHasRSVPed(false);
          setRsvpResponse(null);
          setIsAdmin(false);
          setAdminWeddingSlug(null);
          hasCheckedAdminRef.current = false;
          setIsLoading(false);
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

    // Safety timeout to prevent infinite loading (silent)
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(safetyTimeout);
    };
  }, []);

  useEffect(() => {
    if (user && !isLoading) {
      // Skip RSVP checks on public/non-wedding routes
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (isOnLandingPage() || path.startsWith('/admin') || path.startsWith('/onboarding') || path.startsWith('/auth')) {
          setHasRSVPed(false);
          setRsvpResponse(null);
          setIsCheckingRSVP(false);
          return;
        }
      }

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
  }, [user?.id, isLoading]);


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasRSVPed,
        rsvpResponse,
        isCheckingRSVP,
        isAdmin,
        adminWeddingSlug,
        currentWeddingSlug,
        setCurrentWeddingSlug,
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