import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { api, ApiError } from "@/lib/api"
import type { UserProfile } from "@/types"

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  phone?: string
  collegeId?: string
  college?: { id: string; name: string; slug: string; logoUrl?: string }
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
  isAdmin: boolean
  onboardingComplete: boolean
  emailVerified: boolean
  wallet?: { id: string; balance: string; frozenBalance: string }
  avgRating?: number
  reviewCount?: number
}

interface RegisterInput {
  email: string
  password: string
  fullName: string
}

interface LoginInput {
  email: string
  password: string
}

interface AuthContextType {
  /** Current authenticated user, null when not logged in */
  user: AuthUser | null
  /** True while initial /me check is in flight */
  isLoading: boolean
  /** True if we have a valid session */
  isAuthenticated: boolean
  /** Alias for isAuthenticated — allows drop-in replacement for Clerk's useAuth */
  isSignedIn: boolean

  /** Register a new account. Returns email that verification was sent to. */
  register: (input: RegisterInput) => Promise<{ email: string }>
  /** Log in with email + password. Sets session cookies. */
  login: (input: LoginInput) => Promise<void>
  /** Log out — clears httpOnly cookies on server and local state. */
  logout: () => Promise<void>
  /** Re-fetch /me to refresh user data (e.g., after onboarding) */
  refreshUser: () => Promise<void>
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /** Fetch current session user via GET /api/auth/me (cookie-based) */
  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser }>("/api/auth/me")
      setUser(data.user)
    } catch (err) {
      // 401 = not logged in — that's expected, not an error
      if (err instanceof ApiError && err.statusCode === 401) {
        setUser(null)
      } else {
        // Unexpected error — still clear user but log it
        console.error("Auth check failed:", err)
        setUser(null)
      }
    }
  }, [])

  /** On mount: check if we have a valid session */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await fetchMe()
      setIsLoading(false)
    }
    init()
  }, [fetchMe])

  const register = useCallback(
    async (input: RegisterInput): Promise<{ email: string }> => {
      const data = await api.post<{ email: string }>("/api/auth/register", input)
      return data
    },
    []
  )

  const login = useCallback(
    async (input: LoginInput) => {
      const data = await api.post<{ user: AuthUser }>("/api/auth/login", input)
      setUser(data.user)
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      // Even if server call fails, clear local state
    }
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    await fetchMe()
  }, [fetchMe])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSignedIn: !!user,
        register,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Returns the auth context. Must be used inside `<AuthProvider>`.
 * Drop-in replacement for Clerk's `useAuth()` + `useUser()`.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return ctx
}

/**
 * Type alias so existing code that imported UserProfile can use the auth user.
 */
export type { AuthUser, AuthContextType }
