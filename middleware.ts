import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define PUBLIC routes that do NOT require login
const publicPaths = ["/login", "/logout", "/api", "/_next", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all public routes
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  // Read Firebase token from cookies
  const token = req.cookies.get("firebaseToken")?.value;

  // If the user is NOT logged in → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Otherwise allow the request
  return NextResponse.next();
}

// IMPORTANT: Define which routes should be protected
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patients/:path*",
    "/consultations/:path*",
    "/documents/:path*",
  ],
};
