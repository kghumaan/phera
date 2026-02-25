import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { PheraDatabase } from '@/lib/supabase/types';

export async function middleware(request: NextRequest) {
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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
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
    if (!user) {
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

        const wedding = weddingData as any;

        if (wedding && wedding.created_by !== user.id) {
          // Check if user is an admin
          const { data: adminData } = await supabase
            .from('wedding_admins')
            .select('id')
            .eq('wedding_id', wedding.id)
            .eq('user_id', user.id)
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

