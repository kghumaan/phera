import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the route requires authentication
  const pathname = request.nextUrl.pathname;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      // Redirect to login with return URL
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // For wedding-specific admin routes, verify wedding ownership
    // Exclude general admin pages like /admin/page, /admin/dashboard, etc.
    if (pathname.match(/^\/admin\/[^\/]+/) && !pathname.match(/^\/admin\/(page|dashboard|events|guests|settings|new)($|\/)/)) {
      const weddingSlugMatch = pathname.match(/\/admin\/([^\/]+)/);
      if (weddingSlugMatch) {
        const weddingSlug = weddingSlugMatch[1];
        
        // Fetch wedding to check ownership
        const { data: wedding } = await supabase
          .from('weddings')
          .select('id, created_by')
          .eq('slug', weddingSlug)
          .single();

        if (wedding && wedding.created_by !== session.user.id) {
          // Check if user is an admin
          const { data: adminData } = await supabase
            .from('wedding_admins')
            .select('id')
            .eq('wedding_id', wedding.id)
            .eq('user_id', session.user.id)
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

