'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    
    const fetchUserAndWedding = async () => {
      try {
        console.log('[Admin] Attempt', retryCount + 1, '- Fetching user and wedding...');
        
        // First try to get session (reads from cookies, more reliable after OAuth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('[Admin] Session check:', session ? 'Found' : 'Not found', sessionError || '');
        
        if (!session) {
          retryCount++;
          
          // Retry a few times before giving up (for OAuth flow)
          if (retryCount < MAX_RETRIES) {
            console.log(`[Admin] No session yet, retrying in ${retryCount}s... (${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => {
              if (isMounted) {
                fetchUserAndWedding();
              }
            }, retryCount * 1000); // Exponential backoff: 1s, 2s, 3s, 4s
            return;
          }
          
          // After retries, set up listener for future auth events
          console.log('[Admin] Max retries reached, setting up auth listener...');
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (!isMounted) return;
              
              console.log('[Admin] Auth state changed:', event, 'Has session:', !!newSession);
              
              if (event === 'SIGNED_IN' && newSession) {
                await fetchUserAndWeddingWithUser(newSession.user);
              } else if (event === 'SIGNED_OUT') {
                if (isMounted) {
                  setIsLoading(false);
                }
              }
            }
          );
          
          authSubscription = subscription;
          
          // Final fallback - stop loading after 10 seconds
          setTimeout(() => {
            if (isMounted && isLoading) {
              console.log('[Admin] Timeout after 10s, stopping loading...');
              setIsLoading(false);
            }
          }, 10000);
          
          return;
        }
        
        // Session exists, proceed with user
        console.log('[Admin] Session found, fetching wedding...');
        await fetchUserAndWeddingWithUser(session.user);
        
      } catch (err) {
        console.error('[Admin] Unexpected error:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    const fetchUserAndWeddingWithUser = async (currentUser: any) => {
      if (!isMounted) return;
      
      try {
        console.log('[Admin] User found:', currentUser.email);

        // Fetch user's wedding
        console.log('[Admin] Fetching wedding for user:', currentUser.id);
        
        const { data: weddingData, error } = await supabase
          .from('weddings')
          .select('*')
          .eq('created_by', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('[Admin] Wedding data:', weddingData);
        console.log('[Admin] Wedding error:', error);

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('[Admin] Error fetching wedding:', error);
        } else if (weddingData) {
          // User has a wedding, redirect to onboarding overview (main editing interface)
          console.log('[Admin] Wedding found, redirecting to onboarding overview...');
          router.replace(`/admin/onboarding/${weddingData.slug}/overview`);
          return;
        } else {
          // No wedding found - redirect to onboarding
          console.log('[Admin] No wedding found, redirecting to onboarding...');
          router.replace('/admin/onboarding/new/overview');
          return;
        }
      } catch (err) {
        console.error('[Admin] Error in fetchUserAndWeddingWithUser:', err);
      } finally {
        if (isMounted) {
          console.log('[Admin] Setting loading to false');
          setIsLoading(false);
        }
      }
    };

    fetchUserAndWedding();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router]); // Add router back since we use it

  // Always show loading state - this page just handles redirects
  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh'
      }}>
        <CircularProgress sx={{ color: '#DE3F5E' }} />
      </Box>
    </OptimizedBackground>
  );
}
