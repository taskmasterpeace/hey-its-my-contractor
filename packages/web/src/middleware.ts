import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  console.log(`🔥 MIDDLEWARE RUNNING FOR: ${request.nextUrl.pathname}`);

  // Simple test - if we can see this log, middleware is working
  if (request.nextUrl.pathname === "/test-middleware") {
    return NextResponse.json({ message: "Middleware is working!" });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
