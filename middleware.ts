import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const adminOnlyRoutes = ["/members", "/attendance", "/notifications", "/analytics", "/settings"]

  // Check if the current path is an admin-only route
  const isAdminRoute = adminOnlyRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute) {
    // In a real app, you would verify the user's role from their JWT token
    // For now, we'll let the client-side components handle the redirect
    // This middleware serves as an additional security layer
    // You can add server-side role verification here if needed
    // const token = request.cookies.get('auth-token')
    // if (!token || !isAdmin(token)) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }
  }

  return NextResponse.next()
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth).*)",
  ],
}
