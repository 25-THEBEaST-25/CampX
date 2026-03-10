/** Authenticated user attached to req.user by requireAuth middleware */
export interface AuthUser {
  /** Internal DB user ID (cuid) */
  id: string
  /** Clerk external user ID */
  clerkId: string
  email: string
  isAdmin: boolean
  verificationStatus: string
  onboardingComplete: boolean
}

/** Extend Express Request with the authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/** Standard API success response wrapper */
export interface ApiResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/** Standard API error response */
export interface ApiError {
  success: false
  error: string
  code: string
  details?: unknown
}

/** Cursor-based pagination result */
export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export {}
