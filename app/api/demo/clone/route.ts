import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cloneDemoWedding, cleanupExpiredDemoWeddings } from '@/lib/demo/clone-demo-wedding';
import type { PheraDatabase } from '@/lib/supabase/types';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<PheraDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiStart = Date.now();

    // Lazy cleanup of expired demo weddings — don't block clone on this.
    // Fire-and-forget: the clone result is what matters for time-to-demo.
    cleanupExpiredDemoWeddings(user.id).catch(err => {
      console.error('Demo cleanup error (non-fatal):', err);
    });

    // Clone template
    const cloneStart = Date.now();
    const slug = await cloneDemoWedding(user.id);
    console.log(`[demo-clone] cloneDemoWedding wall: ${Date.now() - cloneStart}ms`);
    console.log(`[demo-clone] /api/demo/clone total: ${Date.now() - apiStart}ms`);

    return NextResponse.json({ slug });
  } catch (error: any) {
    console.error('Demo clone error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create demo session' },
      { status: 500 }
    );
  }
}
