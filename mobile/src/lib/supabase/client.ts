import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when Supabase env vars are absent. The app then runs against
 * `src/lib/mock/` fixtures with a visible "Preview data" badge — used for
 * cloud dev sessions, tests, and store screenshots. See MOBILE-PLAN.md §2.
 */
export const isPreviewMode = !url || !anonKey;

/**
 * Same Supabase project as the web app (`lib/supabase/client.ts`), with
 * session persistence in AsyncStorage on native. `null` in preview mode —
 * gate every use behind `isPreviewMode` or use the data hooks in
 * `src/lib/data/`, which handle the fallback.
 */
export const supabase: SupabaseClient | null = isPreviewMode
  ? null
  : createClient(url!, anonKey!, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : null),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
