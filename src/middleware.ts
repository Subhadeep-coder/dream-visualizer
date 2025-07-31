import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If user is authenticated and trying to access auth pages, redirect to /me
    if (req.nextauth.token && req.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/me", req.url));
    }

    // If user is authenticated and on root, redirect to /me
    if (req.nextauth.token && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/me", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (
          req.nextUrl.pathname === "/" ||
          req.nextUrl.pathname.startsWith("/auth")
        ) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
