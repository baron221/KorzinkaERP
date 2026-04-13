import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

// These paths do not require authentication
const publicPaths = ["/login", "/api/auth/login", "/_next", "/favicon.ico", "/images"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if current path is public
  const isPublicPath = publicPaths.some(p => path.startsWith(p));

  const sessionCookie = request.cookies.get("session")?.value;
  let session = null;

  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie);
    } catch (e) {
      // invalid token
    }
  }

  // 1. Redirect unauthenticated users to /login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // 2. Redirect logged-in users away from /login to dashboard => "/"
  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
