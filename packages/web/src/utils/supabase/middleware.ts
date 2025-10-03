import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory cache for session validation
const sessionCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Try to get session from cache first
  const sessionToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("sb-refresh-token")?.value ||
    "anonymous";

  const cachedEntry = sessionCache.get(sessionToken);
  const now = Date.now();

  let user, error;

  // Use cached result if available and not expired
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
    user = cachedEntry.user;
    error = null;
  } else {
    // Fetch fresh data from Supabase
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user;
    error = authResult.error;

    // Cache the result
    sessionCache.set(sessionToken, {
      user,
      timestamp: now,
    });

    // Clean up expired entries (simple cleanup)
    if (sessionCache.size > 1000) {
      for (const [key, value] of sessionCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          sessionCache.delete(key);
        }
      }
    }
  }

  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/forgot-password", "/error"];

  const isAuthApiRoute = request.nextUrl.pathname.startsWith("/auth/");
  const isPublicRoute =
    publicRoutes.includes(request.nextUrl.pathname) || isAuthApiRoute;

  // If user is not authenticated and trying to access a protected route
  if (!user && !isPublicRoute) {
    console.log(`Redirecting to login from: ${request.nextUrl.pathname}`);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the original URL to redirect back after login
    if (request.nextUrl.pathname !== "/") {
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute && !isAuthApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse;
}
