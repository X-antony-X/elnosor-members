import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminOnlyRoutes = ["/members", "/attendance", "/posts", "/settings"];

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/notifications",
    "/about",
  ];

  // Check if the current path is an admin-only route
  const isAdminRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) || isAdminRoute;

  if (isProtectedRoute) {
    const authToken =
      request.cookies.get("__session")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!authToken) {
      // Redirect to auth page if not authenticated
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    if (isAdminRoute) {
      const response = NextResponse.next();
      response.headers.set("X-Admin-Required", "true");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (authentication pages)
     * - / (home page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth|$).*)",
  ],
};
