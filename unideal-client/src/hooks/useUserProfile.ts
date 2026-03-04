// ============================================
// Hook: useUserProfile — fetch authenticated user profile
// ============================================

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import type { UserProfile } from "@/types"

/** Returns the currently signed-in user's Unideal profile */
export function useUserProfile() {
  const { isSignedIn } = useAuth()

  return useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: () => api.get<UserProfile>("/api/users/me"),
    enabled: !!isSignedIn,
  })
}
