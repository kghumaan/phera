import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { isPreviewMode, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export { isPreviewMode };

// ── Runtime demo tour ("Just exploring? Browse a sample wedding") ──
// Unlike compile-time preview mode, this flips at runtime in LIVE builds:
// a curious first-time user tours the app on the bundled fixture wedding
// without an account. Session-only by design — an app restart exits it.
let demoMode = false;
export const enableDemoMode = () => {
  demoMode = true;
};
export const disableDemoMode = () => {
  demoMode = false;
};
export const isDemoMode = () => demoMode;

/** True when data should come from `src/lib/mock/` fixtures — either the
 *  compile-time preview build or the runtime demo tour. */
export const inMockMode = () => isPreviewMode || demoMode;

/**
 * Same Supabase project as the web app (`lib/supabase/client.ts`), with
 * session persistence in AsyncStorage on native. Connects to production
 * by default (see `src/lib/config.ts`); `null` only in explicit preview
 * mode (EXPO_PUBLIC_PREVIEW=1), where the app runs on `src/lib/mock/`
 * fixtures — gate every use behind `isPreviewMode` or use the data hooks
 * in `src/lib/data/`, which handle the fallback.
 */
export const supabase: SupabaseClient | null = isPreviewMode
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : null),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
