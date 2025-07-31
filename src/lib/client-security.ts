"use client";

class ClientSecurity {
  private csrfToken: string | null = null;
  private csrfExpiry = 0;
  private refreshPromise: Promise<string> | null = null;

  /**
   * Get or refresh CSRF token with automatic retry
   */
  async getCSRFToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.csrfToken && Date.now() < this.csrfExpiry) {
      return this.csrfToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchNewToken();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Fetch new token from server
   */
  private async fetchNewToken(): Promise<string> {
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
      this.csrfToken = null;
      this.csrfExpiry = 0;
      throw error;
    }
  }

  /**
   * Create secure fetch with automatic retry on token expiry
   */
  async secureFetch(
    url: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<Response> {
    const maxRetries = 2;

    try {
      const csrfToken = await this.getCSRFToken();

      const secureHeaders = {
        "Content-Type": "application/json",
        "X-Dream-Journal-Request":
          process.env.NEXT_PUBLIC_SECURITY_HEADER || "dream-journal-app",
        "X-CSRF-Token": csrfToken,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers: secureHeaders,
      });

      // If we get a 403 security error and haven't exceeded retry limit
      if (response.status === 403 && retryCount < maxRetries) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's a security validation error (likely token expiry)
        if (errorData.error === "Security validation failed") {
          console.log("Security token expired, refreshing and retrying...");

          await this.getCSRFToken(true);

          return this.secureFetch(url, options, retryCount + 1);
        }
      }

      return response;
    } catch (error) {
      if (retryCount < 1) {
        console.log("Network error, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.secureFetch(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Clear cached token (useful on logout or critical errors)
   */
  clearToken(): void {
    this.csrfToken = null;
    this.csrfExpiry = 0;
    this.refreshPromise = null;
  }

  /**
   * Pre-warm token (useful on app initialization)
   */
  async preWarmToken(): Promise<void> {
    try {
      await this.getCSRFToken();
    } catch (error) {
      console.log("Token pre-warm failed, will fetch when needed");
    }
  }

  /**
   * Check if token is close to expiry and refresh if needed
   */
  async maintainToken(): Promise<void> {
    const bufferTime = 5 * 60 * 1000;
    if (this.csrfToken && Date.now() > this.csrfExpiry - bufferTime) {
      try {
        await this.getCSRFToken(true);
      } catch (error) {
        // Silently fail - token will be fetched when needed
        console.log("Token maintenance failed, will fetch when needed");
      }
    }
  }
}

// Create singleton instance
export const clientSecurity = new ClientSecurity();

if (typeof window !== "undefined") {
  setInterval(
    () => {
      clientSecurity.maintainToken();
    },
    5 * 60 * 1000,
  );

  window.addEventListener("load", () => {
    clientSecurity.preWarmToken();
  });
}
