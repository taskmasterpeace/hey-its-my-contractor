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

// TODO:: AUTHENTICATED API ROUTES
// import { createServerClient } from "@supabase/ssr";
// import { NextResponse, type NextRequest } from "next/server";

// export async function updateSession(request: NextRequest) {
//   let supabaseResponse = NextResponse.next({
//     request,
//   });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value }) =>
//             request.cookies.set(name, value)
//           );
//           supabaseResponse = NextResponse.next({
//             request,
//           });
//           cookiesToSet.forEach(({ name, value }) =>
//             supabaseResponse.cookies.set(name, value)
//           );
//         },
//       },
//     }
//   );

//   // IMPORTANT: Avoid writing any logic between createServerClient and
//   // supabase.auth.getUser(). A simple mistake could make it very hard to debug
//   // issues with users being randomly logged out.

//   // Try to get user from cookies first
//   let { data: { user } } = await supabase.auth.getUser();

//   // If no user from cookies, check Authorization header
//   if (!user) {
//     const authHeader = request.headers.get('authorization');

//     if (authHeader?.startsWith('Bearer ')) {
//       const token = authHeader.substring(7);

//       try {
//         let accessToken: string | null = null;

//         // Try to decode as base64 first (for base64-encoded session objects)
//         try {
//           const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
//           accessToken = decoded.access_token;
//         } catch {
//           // Try to parse as plain JSON
//           try {
//             const sessionData = JSON.parse(token);
//             accessToken = sessionData.access_token;
//           } catch {
//             // Assume it's a plain JWT token
//             accessToken = token;
//           }
//         }

//         if (accessToken) {
//           const { data, error: authError } = await supabase.auth.getUser(accessToken);

//           if (!authError && data.user) {
//             user = data.user;
//           }
//         }
//       } catch (err) {
//         console.error('Failed to parse authorization header:', err);
//         // Silent fail - will return 401 if authentication is required
//       }
//     }
//   }

//   const pathname = request.nextUrl.pathname;

//   // Define public routes that don't require authentication
//   const publicRoutes = ["/login", "/signup", "/forgot-password", "/error"];

//   // Define public API routes that don't require authentication
//   const publicApiRoutes = [
//     "/api/meetings/process-meeting",
//   ];

//   // Check if it's an API route
//   const isApiRoute = pathname.startsWith("/api/");

//   // Check if it's a public API route
//   const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

//   // Check if it's an auth callback route
//   const isAuthRoute = pathname.startsWith("/auth/");

//   // Check if it's a public page route
//   const isPublicPageRoute = publicRoutes.includes(pathname) || isAuthRoute;

//   // Handle API routes - return 401 if not authenticated (unless it's a public API route)
//   if (isApiRoute && !user && !isPublicApiRoute) {
//     return NextResponse.json(
//       { error: "Unauthorized", message: "Authentication required" },
//       { status: 401 }
//     );
//   }

//   // Handle page routes - redirect to login if not authenticated
//   if (!isApiRoute && !user && !isPublicPageRoute && pathname !== "/") {
//     const url = request.nextUrl.clone();
//     url.pathname = "/login";
//     url.searchParams.set("redirectTo", pathname);
//     return NextResponse.redirect(url);
//   }

//   // If user is authenticated and trying to access login/signup, redirect to home
//   if (user && (pathname === "/login" || pathname === "/signup")) {
//     const url = request.nextUrl.clone();
//     url.pathname = "/";
//     return NextResponse.redirect(url);
//   }

//   // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
//   // creating a new response object with NextResponse.next() make sure to:
//   // 1. Pass the request in it, like so:
//   //    const myNewResponse = NextResponse.next({ request })
//   // 2. Copy over the cookies, like so:
//   //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
//   // 3. Change the myNewResponse object instead of the supabaseResponse object

//   return supabaseResponse;
// }


// --------------------------GLOBAL MIDDLEWARE--------------------------
// import { type NextRequest } from 'next/server'
// import { updateSession } from './utils/supabase/middleware'

// export async function middleware(request: NextRequest) {
//   return await updateSession(request)
// }

// export const config = {
//   matcher: [
//     '/api/:path*',
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }


