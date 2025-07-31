import type { NextRequest } from "next/server";
import crypto from "crypto";

interface SecurityConfig {
  allowedOrigins: string[];
  requireCSRF: boolean;
  customHeaderName: string;
  customHeaderValue: string;
}

const defaultConfig: SecurityConfig = {
  allowedOrigins: [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ].filter(Boolean),
  requireCSRF: true,
  customHeaderName: "X-Dream-Journal-Request",
  customHeaderValue:
    process.env.NEXTAUTH_SECRET?.slice(0, 16) || "dream-journal-app",
};

export class RequestSecurity {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Validate that the request comes from an allowed origin
   */
  validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);

    if (!requestOrigin) {
      return {
        valid: false,
        error: "Missing origin information",
      };
    }

    const isAllowed = this.config.allowedOrigins.some((allowedOrigin) => {
      if (process.env.NODE_ENV === "development") {
        const allowedUrl = new URL(allowedOrigin);
        const requestUrl = new URL(requestOrigin);
        return allowedUrl.hostname === requestUrl.hostname;
      }
      return requestOrigin === allowedOrigin;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Origin ${requestOrigin} not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate custom security header
   */
  validateCustomHeader(request: NextRequest): {
    valid: boolean;
    error?: string;
  } {
    const headerValue = request.headers.get(this.config.customHeaderName);

    if (!headerValue) {
      return {
        valid: false,
        error: `Missing required header: ${this.config.customHeaderName}`,
      };
    }

    if (headerValue !== this.config.customHeaderValue) {
      return {
        valid: false,
        error: "Invalid security header value",
      };
    }

    return { valid: true };
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId?: string): string {
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    const payload = `${sessionId || "anonymous"}-${timestamp}-${randomBytes}`;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const signature = hmac.digest("hex");

    return Buffer.from(`${payload}.${signature}`).toString("base64");
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(
    token: string,
    sessionId?: string,
    maxAge = 3600000,
  ): { valid: boolean; error?: string } {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [payload, signature] = decoded.split(".");

      if (!payload || !signature) {
        return { valid: false, error: "Invalid token format" };
      }

      const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest("hex");

      if (signature !== expectedSignature) {
        return { valid: false, error: "Invalid token signature" };
      }

      const [tokenSessionId, timestamp, randomBytes] = payload.split("-");

      // Validate session ID if provided
      if (
        sessionId &&
        tokenSessionId !== sessionId &&
        tokenSessionId !== "anonymous"
      ) {
        return { valid: false, error: "Token session mismatch" };
      }

      // Validate timestamp
      const tokenTime = Number.parseInt(timestamp);
      const now = Date.now();

      if (now - tokenTime > maxAge) {
        return { valid: false, error: "Token expired" };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: "Token parsing failed" };
    }
  }

  /**
   * Comprehensive request validation
   */
  validateRequest(
    request: NextRequest,
    options: {
      checkOrigin?: boolean;
      checkCustomHeader?: boolean;
      checkCSRF?: boolean;
      csrfToken?: string;
      sessionId?: string;
    } = {},
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const {
      checkOrigin = true,
      checkCustomHeader = true,
      checkCSRF = this.config.requireCSRF,
      csrfToken,
      sessionId,
    } = options;

    // Validate origin
    if (checkOrigin) {
      const originResult = this.validateOrigin(request);
      if (!originResult.valid) {
        errors.push(originResult.error!);
      }
    }

    // Validate custom header
    if (checkCustomHeader) {
      const headerResult = this.validateCustomHeader(request);
      if (!headerResult.valid) {
        errors.push(headerResult.error!);
      }
    }

    // Validate CSRF token
    if (checkCSRF && csrfToken) {
      const csrfResult = this.validateCSRFToken(csrfToken, sessionId);
      if (!csrfResult.valid) {
        errors.push(csrfResult.error!);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const requestSecurity = new RequestSecurity();

export function createSecurityErrorResponse(errors: string[], status = 403) {
  return new Response(
    JSON.stringify({
      error: "Security validation failed",
      details: errors,
      message: "Request does not meet security requirements",
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Security-Error": "true",
      },
    },
  );
}
