// ============================================
// API Client — Clerk-authenticated fetch wrapper
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
  private getToken: (() => Promise<string | null>) | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000"
  }

  /**
   * Registers the Clerk token getter. Call this once inside a
   * React component tree that has access to `useAuth()`.
   */
  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken ? await this.getToken() : null

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

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

    return response.json() as Promise<T>
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
      body: JSON.stringify(body),
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

/** Singleton API client — configure token getter via `useApiInit()` hook */
export const api = new ApiClient()
