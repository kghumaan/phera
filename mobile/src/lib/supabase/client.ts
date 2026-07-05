import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { isPreviewMode, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export { isPreviewMode };

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
