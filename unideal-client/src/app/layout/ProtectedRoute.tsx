import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth, useUser } from "@clerk/clerk-react"

/**
 * Route wrapper that:
 * 1. Redirects unauthenticated users to Clerk sign-in (via redirect param)
 * 2. Redirects users who haven't completed onboarding to /onboarding
 *    (skipping the onboarding route itself to prevent infinite loops)
 */
export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { pathname } = useLocation()

  // Wait for Clerk to initialise
  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    // Preserve the intended destination via ?redirect_url
    const redirectUrl = encodeURIComponent(pathname)
    return <Navigate to={`/?redirect_url=${redirectUrl}`} replace />
  }

  // Check onboarding completion — stored in Clerk public metadata
  const onboardingComplete =
    (user?.publicMetadata as { onboardingComplete?: boolean })
      ?.onboardingComplete ?? false

  if (!onboardingComplete && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
