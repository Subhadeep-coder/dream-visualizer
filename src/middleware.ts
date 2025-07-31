import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Add security headers to all responses
    const response = NextResponse.next();

    // Security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Basic CSP for the app
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com;",
    );

    // If user is authenticated and trying to access auth pages, redirect to /me
    if (req.nextauth.token && pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/me", req.url));
    }

    // If user is authenticated and on root, redirect to /me
    if (req.nextauth.token && pathname === "/") {
      return NextResponse.redirect(new URL("/me", req.url));
    }

    if (pathname.startsWith("/api/")) {
      response.headers.set("X-API-Request", "true");

      const origin = req.headers.get("origin");
      const allowedOrigins = [
        process.env.NEXTAUTH_URL || "http://localhost:3000",
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
      ].filter(Boolean);

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        response.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Dream-Journal-Request, X-CSRF-Token",
        );
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/csrf")
        ) {
          return true;
        }

        if (pathname === "/api/health") {
          return true;
        }

        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
