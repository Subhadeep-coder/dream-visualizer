import type { NextResponse } from "next/server";

export function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (basic)
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  );

  return response;
}

export function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1024 * 1024,
) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength) > maxSizeBytes) {
    return new Response(
      JSON.stringify({
        error: "Request too large",
        message: `Request size exceeds ${maxSizeBytes} bytes`,
      }),
      {
        status: 413,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return null;
}
