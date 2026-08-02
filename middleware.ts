import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { PheraDatabase } from '@/lib/supabase/types';
import { OPS_COOKIE_NAME } from '@/lib/ops/constants';
import { verifyOpsSession } from '@/lib/ops/auth';

export async function middleware(request: NextRequest) {
  // Gate /ops/* and /api/ops/* before touching Supabase — PIN-only internal route.
  const opsPath = request.nextUrl.pathname;
  if (opsPath.startsWith('/ops') || opsPath.startsWith('/api/ops')) {
    const isEnter = opsPath === '/ops/enter' || opsPath.startsWith('/ops/enter/');
    const isVerifyEndpoint = opsPath === '/api/ops/verify-pin';
    const session = request.cookies.get(OPS_COOKIE_NAME)?.value;
    const valid = await verifyOpsSession(session);

    if (isVerifyEndpoint) return NextResponse.next();

    if (!isEnter && !valid) {
      if (opsPath.startsWith('/api/ops')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/ops/enter', request.url));
    }
    if (isEnter && valid) {
      return NextResponse.redirect(new URL('/ops', request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<PheraDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the route requires authentication
  const pathname = request.nextUrl.pathname;

  // --- WhatsApp /go/ Redirection Engine ---
  // Handle paths like /go/[pageKey]/[weddingSlug] for WhatsApp compatibility
  // where placeholders must be at the end of the URL
  if (pathname.startsWith('/go/')) {
    const parts = pathname.split('/').filter(Boolean); // ['go', 'pageKey', 'weddingSlug']

    if (parts.length >= 2) {
      const pageKey = parts[1];
      const weddingSlug = parts[2] || ''; // Slug might be optional or empty for some reasons

      // Mapping table for short keys to actual app paths
      const pathMap: Record<string, string> = {
        'events': 'events',
        'schedule': 'schedule',
        'travel': 'travel',
        'shopping': 'where-to-shop',
        'faq': 'faq',
        'registry': 'registry',
        'rsvp': 'rsvp',
        'travel-details': 'travel-details',
        'details': 'details'
      };

      const targetPath = pathMap[pageKey];

      if (targetPath) {
        // Construct the final destination URL
        const destination = weddingSlug
          ? `/${weddingSlug}/${targetPath}`
          : `/${targetPath}`; // Fallback if slug is missing (though usually required)

        return NextResponse.redirect(new URL(destination, request.url));
      }
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Allow demo routes through without server-side auth check.
    // Demo auth is handled client-side via signInWithPassword on the /demo page.
    const isDemoRoute = pathname.startsWith('/admin/demo');

    if (!user && !isDemoRoute) {
      // Redirect to login with return URL
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // For wedding-specific admin routes, verify wedding ownership
    // Exclude general admin pages like /admin/page, /admin/dashboard, etc.
    if (pathname.match(/^\/admin\/[^\/]+/) && !pathname.match(/^\/admin\/(page|dashboard|events|guests|settings|new|demo)($|\/)/)) {
      const weddingSlugMatch = pathname.match(/\/admin\/([^\/]+)/);
      if (weddingSlugMatch) {
        const weddingSlug = weddingSlugMatch[1];

        // Fetch wedding to check ownership
        const { data: weddingData } = await supabase
          .from('weddings')
          .select('id, created_by')
          .eq('slug', weddingSlug)
          .single();

        const wedding = weddingData as { id: string; created_by: string } | null;

        if (wedding && user && wedding.created_by !== user.id) {
          // Check if user is an admin
          const { data: adminData } = await supabase
            .from('wedding_admins')
            .select('id')
            .eq('wedding_id', wedding.id)
            .eq('user_id', user!.id)
            .single();

          if (!adminData) {
            // User is not authorized
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api/whatsapp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

