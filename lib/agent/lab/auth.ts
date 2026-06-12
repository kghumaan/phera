import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';

/**
 * Lab access is dual-mode:
 *  - session: a logged-in admin using the /agent-lab page (RLS enforced)
 *  - token:   scripted/CLI access via `Authorization: Bearer ${AGENT_LAB_TOKEN}`
 *             (service-role client; lab routes guard the agent-lab- namespace)
 *
 * If AGENT_LAB_TOKEN is not configured, every lab route 404s — the lab simply
 * does not exist in environments that haven't opted in.
 */
export interface LabAccess {
  supabase: SupabaseClient;
  ownerId: string | null;
  mode: 'session' | 'token';
}

let cachedTokenOwnerId: string | null | undefined;

async function resolveTokenOwnerId(supabase: SupabaseClient): Promise<string | null> {
  if (cachedTokenOwnerId !== undefined) return cachedTokenOwnerId;
  const email = process.env.AGENT_LAB_OWNER_EMAIL;
  if (!email) {
    cachedTokenOwnerId = null;
    return null;
  }
  try {
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    cachedTokenOwnerId = match?.id ?? null;
  } catch {
    cachedTokenOwnerId = null;
  }
  return cachedTokenOwnerId;
}

/** Test-only: reset the cached owner lookup. */
export function resetLabAuthCacheForTests() {
  cachedTokenOwnerId = undefined;
}

export async function requireLabAccess(request: Request): Promise<LabAccess | NextResponse> {
  const labToken = process.env.AGENT_LAB_TOKEN;
  if (!labToken) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const provided = authHeader.slice('Bearer '.length).trim();
    if (provided !== labToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const ownerId = await resolveTokenOwnerId(serviceClient);
    return { supabase: serviceClient, ownerId, mode: 'token' };
  }

  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { supabase: supabase as unknown as SupabaseClient, ownerId: user.id, mode: 'session' };
}

export function isLabAccess(value: LabAccess | NextResponse): value is LabAccess {
  return !(value instanceof NextResponse);
}
