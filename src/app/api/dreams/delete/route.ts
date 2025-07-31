import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeDecrypt, isEncrypted } from "@/lib/encryption";
import { dreamDeleteLimiter, createRateLimitResponse } from "@/lib/rate-limit";
import {
  requestSecurity,
  createSecurityErrorResponse,
} from "@/lib/request-security";
import calculatePatterns from "@/lib/calculate-pattern";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = dreamDeleteLimiter.check(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body to get CSRF token
    const body = await request.json();
    const { dreamId, csrfToken } = body;

    // Validate request security
    const securityResult = requestSecurity.validateRequest(request, {
      checkOrigin: true,
      checkCustomHeader: true,
      checkCSRF: true,
      csrfToken,
      sessionId: session.user.id,
    });

    if (!securityResult.valid) {
      console.warn("Security validation failed:", securityResult.errors);
      return createSecurityErrorResponse(securityResult.errors);
    }

    if (!dreamId) {
      return NextResponse.json(
        { error: "Dream ID is required" },
        { status: 400 },
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dreamId)) {
      return NextResponse.json(
        { error: "Invalid dream ID format" },
        { status: 400 },
      );
    }

    const existingDream = await prisma.dream.findFirst({
      where: {
        id: dreamId,
        userId: session.user.id,
      },
    });

    if (!existingDream) {
      return NextResponse.json(
        {
          error: "Dream not found",
          message: "Dream not found or you don't have permission to delete it",
        },
        { status: 404 },
      );
    }

    await prisma.dream.delete({
      where: {
        id: dreamId,
        userId: session.user.id,
      },
    });

    const dreams = await prisma.dream.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const decryptedDreams = dreams.map((dream) => ({
      ...dream,
      description: isEncrypted(dream.description)
        ? safeDecrypt(dream.description)
        : dream.description,
    }));

    const patterns = calculatePatterns(decryptedDreams);

    const response = NextResponse.json({ dreams: decryptedDreams, patterns });
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString(),
    );
    response.headers.set("X-Security-Validated", "true");

    return response;
  } catch (error) {
    console.error("Error deleting dream:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        {
          error: "Dream not found",
          message: "Dream not found or already deleted",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete dream" },
      { status: 500 },
    );
  }
}
