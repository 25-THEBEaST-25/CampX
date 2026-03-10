// ============================================
// Hook: usePublicProfile — fetch public user profile, update own profile
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PublicProfile, UpdateProfileInput, UserProfile } from "@/types"

/**
 * Fetches a public user profile by ID.
 * Used on /profile/:id page.
 */
export function usePublicProfile(userId: string | undefined) {
  return useQuery<PublicProfile>({
    queryKey: ["publicProfile", userId],
    queryFn: () => api.get<PublicProfile>(`/api/users/${userId}`),
    enabled: !!userId,
  })
}

/**
 * Updates the current user's profile (name, phone, avatar).
 * Invalidates profile + publicProfile caches on success.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      api.put<UserProfile>("/api/users/me", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      queryClient.invalidateQueries({ queryKey: ["publicProfile"] })
    },
  })
}
