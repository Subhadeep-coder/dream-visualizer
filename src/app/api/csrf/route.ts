import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  requestSecurity,
  createSecurityErrorResponse,
} from "@/lib/request-security";
import { generalLimiter, createRateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = generalLimiter.check(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const securityResult = requestSecurity.validateRequest(request, {
      checkCSRF: false,
    });

    if (!securityResult.valid) {
      return createSecurityErrorResponse(securityResult.errors);
    }

    const session = await getServerSession(authOptions);
    const sessionId = session?.user?.id;

    // Generate CSRF token
    const csrfToken = requestSecurity.generateCSRFToken(sessionId);

    const response = NextResponse.json({
      csrfToken,
      expiresIn: 3600000,
    });

    // Add rate limit headers
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString(),
    );

    return response;
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate CSRF token",
      },
      { status: 500 },
    );
  }
}
