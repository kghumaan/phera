import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null };
  return { user };
}

export async function GET() {
  const { user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Phera uses ONE phone number for everything (guest concierge + vendor
  // coordinator). PHERA_PHONE_NUMBER is the source of truth;
  // COORDINATOR_PHONE_NUMBER is a legacy fallback for pre-consolidation
  // deployments.
  const phoneNumber = process.env.PHERA_PHONE_NUMBER || process.env.COORDINATOR_PHONE_NUMBER || '';
  const isConfigured = !!phoneNumber;
  const digits = phoneNumber.replace(/\D/g, '');
  const whatsappLink = isConfigured ? `https://wa.me/${digits}` : '';

  return NextResponse.json({ isConfigured, phoneNumber, whatsappLink });
}
