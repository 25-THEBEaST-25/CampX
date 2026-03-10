// ============================================
// API Client — Cookie-authenticated fetch wrapper
// ============================================

import { buildSearchParams } from "@/lib/utils"

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  private baseUrl: string
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5001"
  }

  /**
   * Attempt to refresh the access token using the refresh_token cookie.
   * Returns true if successful, false otherwise.
   */
  private async tryRefresh(): Promise<boolean> {
    // De-duplicate concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        })
        return res.ok
      } catch {
        return false
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })

    // Auto-refresh on 401 (but not for auth endpoints and not on retry)
    if (
      response.status === 401 &&
      !isRetry &&
      !path.startsWith("/api/auth/")
    ) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        return this.request<T>(path, options, true)
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({
        error: "Network error",
      }))
      throw new ApiError(
        response.status,
        (errorBody as { error?: string }).error ?? "Unknown error",
        (errorBody as { code?: string }).code
      )
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T
    }

    const json = await response.json()

    // Unwrap standard { success, data } envelope from the server
    if (json && typeof json === "object" && "success" in json && "data" in json) {
      return json.data as T
    }

    return json as T
  }

  /** GET request with optional query params */
  get<T>(
    path: string,
    opts?: { params?: Record<string, string | number | boolean | undefined | null> }
  ): Promise<T> {
    const url =
      opts?.params ? `${path}?${buildSearchParams(opts.params)}` : path
    return this.request<T>(url)
  }

  /** POST request with JSON body */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  /** PUT request with JSON body */
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  /** PATCH request with JSON body */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }

  /** DELETE request */
  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" })
  }
}

/** Singleton API client — uses httpOnly cookies for auth */
export const api = new ApiClient()
