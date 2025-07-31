"use client";

class ClientSecurity {
  private csrfToken: string | null = null;
  private csrfExpiry = 0;

  /**
   * Get or refresh CSRF token
   */
  async getCSRFToken(): Promise<string> {
    if (this.csrfToken && Date.now() < this.csrfExpiry) {
      return this.csrfToken;
    }

    try {
      const response = await fetch("/api/csrf", {
        method: "GET",
        headers: {
          "X-Dream-Journal-Request":
            process.env.NEXT_PUBLIC_SECURITY_HEADER || "dream-journal-app",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.csrfExpiry = Date.now() + data.expiresIn - 60000;

      return this.csrfToken!;
    } catch (error) {
      console.error("Failed to get CSRF token:", error);
      throw error;
    }
  }

  /**
   * Create secure fetch with all security headers
   */
  async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const csrfToken = await this.getCSRFToken();

    const secureHeaders = {
      "Content-Type": "application/json",
      "X-Dream-Journal-Request":
        process.env.NEXT_PUBLIC_SECURITY_HEADER || "dream-journal-app",
      "X-CSRF-Token": csrfToken,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers: secureHeaders,
    });
  }

  /**
   * Clear cached token (useful on logout)
   */
  clearToken(): void {
    this.csrfToken = null;
    this.csrfExpiry = 0;
  }
}

export const clientSecurity = new ClientSecurity();
