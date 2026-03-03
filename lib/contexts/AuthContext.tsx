'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/auth-service';
import { supabase } from '@/lib/supabase/client';
import { isOnLandingPage } from '@/lib/utils/wedding-id-helpers';

// Helper to detect public routes where the initial auth check should be skipped.
// The onAuthStateChange listener is still kept active on these routes so that
// sign-in events (e.g. from /demo) are caught.
function isPublicRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  // Marketing/landing pages, auth pages don't need the initial auth check
  const publicPaths = ['/', '/auth/signup', '/auth/login', '/auth/callback', '/pricing', '/features', '/contact', '/blog', '/privacy', '/terms'];
  return publicPaths.some(p => path === p) || path.startsWith('/auth/') || path.startsWith('/blog/');
}

// Preview routes are rendered inside an iframe on admin pages.
// Skip ALL auth (including onAuthStateChange) to avoid Navigator Lock contention.
function isPreviewRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/preview/');
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
  const pathname = usePathname();
  const isCheckingAuthRef = useRef(false);
  const hasCheckedAdminRef = useRef(false);
  const lastCheckedWeddingSlug = useRef<string | null>(null);
  // Ref always mirrors currentWeddingSlug state - lets checkAuthStatus read the latest slug
  // without being recreated (avoids stale closure issues with useCallback)
  const currentWeddingSlugRef = useRef<string | null>(null);

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

  const checkAuthStatus = React.useCallback(async (slugOverride?: string) => {
    // Prevent multiple simultaneous auth checks using ref
    if (isCheckingAuthRef.current) {
      console.log('checkAuthStatus: Skipping - already checking');
      return;
    }

    // Use the override slug if provided, then the ref (always current), then the closure value
    const effectiveSlug = slugOverride ?? currentWeddingSlugRef.current ?? currentWeddingSlug;

    console.log('checkAuthStatus: Starting auth check, slug:', effectiveSlug);
    isCheckingAuthRef.current = true;
    try {
      // First check local session (no network, no Navigator Lock) to avoid lock contention
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('checkAuthStatus: No local session, skipping getUser');
        setUser(null);
        setIsLoading(false);
        isCheckingAuthRef.current = false;
        return;
      }

      // Session exists — now verify with the server (acquires Navigator Lock)
      const { data: { user: sbUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        if (userError.name === 'AbortError') {
          console.log('checkAuthStatus: Auth check aborted');
          return;
        }
        if (userError.name === 'AuthSessionMissingError') {
          console.log('checkAuthStatus: No active session');
        } else {
          console.error('checkAuthStatus: User check error:', userError);
        }
      }

      if (sbUser) {
        console.log('checkAuthStatus: Found session for:', sbUser.email);

        // Re-read the ref here (after the async getUser call) to get the latest slug.
        // The slug may have been set while getUser() was in-flight.
        const latestSlug = currentWeddingSlugRef.current ?? effectiveSlug;

        let guestData = null;
        if (sbUser.email && latestSlug) {
          try {
            const { data: guest } = await (supabase as any)
              .from('guests')
              .select('id, name, email, phone, avatar_color, avatar_style, avatar_seed, avatar_svg')
              .eq('email', sbUser.email.toLowerCase())
              .eq('wedding_id', latestSlug)
              .single();
            guestData = guest;
          } catch (err) {
            console.error('checkAuthStatus: Error fetching guest data:', err);
          }
        }

        // If no guest record, try to get avatar from user_settings (for admin users)
        let userSettingsAvatar = null;
        if (!guestData) {
          // Retry loop for user_settings to handle race conditions during signup
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            try {
              const { data: settings } = await (supabase as any)
                .from('user_settings')
                .select('avatar_style, avatar_seed, avatar_svg, avatar_color')
                .eq('user_id', sbUser.id)
                .single();

              if (settings?.avatar_svg) {
                userSettingsAvatar = settings;
                break; // Found it!
              }
            } catch (err) {
              // Non-critical - user_settings may not exist yet
            }

            // If it's a new login and we didn't find settings, wait and retry
            if (attempts < maxAttempts - 1) {
              attempts++;
              console.log(`checkAuthStatus: User settings not found, retry ${attempts}/${maxAttempts}...`);
              await new Promise(resolve => setTimeout(resolve, 800)); // Wait 800ms
            } else {
              break;
            }
          }
        }

        const displayName = guestData?.name || sbUser.user_metadata?.full_name || sbUser.email || '';
        const userData: User = {
          id: sbUser.id,
          guestId: guestData?.id || null,
          email: sbUser.email || '',
          name: displayName,
          phone: guestData?.phone || sbUser.phone,
          initials: generateInitials(displayName),
          // Use DB avatar_color as source of truth so it matches posted comments
          avatar_color: guestData?.avatar_color || userSettingsAvatar?.avatar_color || generateAvatarColor(displayName),
          avatar_style: guestData?.avatar_style || userSettingsAvatar?.avatar_style,
          avatar_seed: guestData?.avatar_seed || userSettingsAvatar?.avatar_seed,
          avatar_svg: guestData?.avatar_svg || userSettingsAvatar?.avatar_svg,
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
                  if (!guestInfo.avatar_svg && guestInfo.email && (effectiveSlug || guestInfo.weddingId)) {
                    try {
                      const { data: guestData } = await supabase
                        .from('guests')
                        .select('avatar_style, avatar_seed, avatar_svg')
                        .eq('email', guestInfo.email.toLowerCase())
                        .eq('wedding_id', effectiveSlug || guestInfo.weddingId)
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

  // Lightweight guest profile fetch - patches user state with guestId/avatar for a specific wedding.
  // Unlike checkAuthStatus, this has no lock guard so it can run even while auth is initializing.
  const fetchGuestProfile = React.useCallback(async (slug: string) => {
    if (!slug) return;

    try {
      // Use getSession (no Navigator Lock) instead of getUser to avoid lock contention
      const { data: { session } } = await supabase.auth.getSession();
      const sbUser = session?.user;
      if (!sbUser?.email) return;

      const { data: guest, error } = await (supabase as any)
        .from('guests')
        .select('id, name, email, phone, avatar_color, avatar_style, avatar_seed, avatar_svg')
        .eq('email', sbUser.email.toLowerCase())
        .eq('wedding_id', slug)
        .single();

      if (error || !guest) {
        console.log('fetchGuestProfile: No guest record found for', sbUser.email, 'in', slug);
        return;
      }

      console.log('fetchGuestProfile: Found guest record, patching user state with guestId:', guest.id);

      // Patch the existing user state with the guest profile data
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          guestId: guest.id,
          name: guest.name || prev.name,
          avatar_color: guest.avatar_color || prev.avatar_color,
          avatar_style: guest.avatar_style,
          avatar_seed: guest.avatar_seed,
          avatar_svg: guest.avatar_svg,
        };
      });
    } catch (err) {
      console.error('fetchGuestProfile: Error:', err);
    }
  }, []);

  // Set the current wedding slug and trigger RSVP recheck if changed
  const setCurrentWeddingSlug = React.useCallback((slug: string) => {
    if (slug && slug !== currentWeddingSlug) {
      console.log('🔄 [AuthContext] Wedding slug changed:', currentWeddingSlug, '->', slug);
      // Update the ref immediately so any in-flight checkAuthStatus reads the new slug
      currentWeddingSlugRef.current = slug;
      setCurrentWeddingSlugState(slug);
      // Reset RSVP state when wedding changes
      setHasRSVPed(false);
      setRsvpResponse(null);
      // Note: fetchGuestProfile is triggered by the useEffect watching currentWeddingSlug
    }
  }, [currentWeddingSlug]);



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
        // For main guests, query the guest's RSVP directly
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
        .eq('wedding_id', currentWeddingSlug || '')
        .single();

      if (rsvpData && rsvpData.plus_one_email) {
        // Create virtual guest authentication for plus one
        const guestInfo = {
          id: `plus-one-${rsvpData.guest_id}`,
          email: rsvpData.plus_one_email,
          name: rsvpData.plus_one_name || 'Plus One',
          phone: undefined,
          weddingId: currentWeddingSlug || '',
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
                .eq('wedding_id', currentWeddingSlug || '')
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

  // Auto-logout demo user if they leave admin routes
  useEffect(() => {
    const isDemoUser = user?.email === 'demo@phera.io';
    const isAdminRoute = pathname.startsWith('/admin');
    const isDemoEntryPoint = pathname === '/demo' || pathname.startsWith('/admin/demo');

    if (isDemoUser && !isAdminRoute && !isDemoEntryPoint) {
      console.log('[AuthContext] Demo user leaving admin area, restoring previous session...');

      const restoreOrSignOut = async () => {
        try {
          const saved = sessionStorage.getItem('phera_pre_demo_session');
          if (saved) {
            const { access_token, refresh_token } = JSON.parse(saved);
            sessionStorage.removeItem('phera_pre_demo_session');

            // Sign out the demo user first
            await supabase.auth.signOut();

            // Restore the previous user's session
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              console.error('[AuthContext] Failed to restore previous session:', error);
            } else {
              console.log('[AuthContext] Previous session restored successfully');
            }
          } else {
            // No previous session to restore — just sign out
            signOut();
          }
        } catch (err) {
          console.error('[AuthContext] Error restoring session:', err);
          signOut();
        }
      };

      restoreOrSignOut();
    }
  }, [pathname, user?.email, signOut]);

  useEffect(() => {
    let mounted = true;

    // Preview routes are rendered inside an iframe on admin pages.
    // Skip ALL auth to avoid Navigator Lock contention (same-origin exclusive lock).
    if (isPreviewRoute()) {
      console.log('Skipping auth on preview route:', window.location.pathname);
      setIsLoading(false);
      return () => { mounted = false; };
    }

    // For non-preview public routes (/, /pricing, etc.), skip the initial auth check
    // but keep the onAuthStateChange listener active (needed for /demo sign-in flow).
    if (!isPublicRoute()) {
      const initAuth = async () => {
        if (mounted) {
          await checkAuthStatus();
        }
      };
      initAuth().catch(console.error);
    } else {
      console.log('Skipping initial auth check on public route:', window.location.pathname);
      setIsLoading(false);
    }

    // Always subscribe on non-preview routes so sign-in events are caught
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          checkAuthStatus();
          console.log('SIGNED_IN event triggered full auth check for:', session.user.email);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed for:', session.user.email);
        } else if (event === 'SIGNED_OUT') {
          // Guard: try to recover the session before clearing state.
          // Supabase can emit SIGNED_OUT during token refresh cycles.
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession?.user) {
              console.log('SIGNED_OUT event ignored - session still valid for:', currentSession.user.email);
              return;
            }
          } catch {
            // getSession failed, proceed with sign-out
          }

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

  // Re-fetch guest profile (avatar, guestId) whenever the wedding slug changes in state.
  // Uses fetchGuestProfile (not checkAuthStatus) to avoid the isCheckingAuthRef lock.
  useEffect(() => {
    if (currentWeddingSlug) {
      fetchGuestProfile(currentWeddingSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeddingSlug]);

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