import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { ROUTES } from "@/lib/constants"

/**
 * Route wrapper that:
 * 1. Redirects unauthenticated users to sign-in
 * 2. Redirects users who haven't completed onboarding to /onboarding
 *    (skipping the onboarding route itself to prevent infinite loops)
 */
export function ProtectedRoute() {
  const { isLoading, isAuthenticated, user } = useAuth()
  const { pathname } = useLocation()

  // Wait for auth to initialise
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    const redirectUrl = encodeURIComponent(pathname)
    return <Navigate to={`${ROUTES.SIGN_IN}?redirect_url=${redirectUrl}`} replace />
  }

  // Check onboarding completion
  if (!user.onboardingComplete && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
