// ============================================
// Hook: useVerification — fetch status + submit ID
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import type { Verification, VerificationSubmitInput, UserProfile } from "@/types"

/** Returns the latest verification submission for the current user */
export function useVerificationStatus() {
  const { isSignedIn } = useAuth()

  return useQuery<Verification | null>({
    queryKey: ["verification"],
    queryFn: () => api.get<Verification | null>("/api/verifications/me"),
    enabled: !!isSignedIn,
  })
}

/** Submits a new verification request with an uploaded ID card URL */
export function useSubmitVerification() {
  const queryClient = useQueryClient()

  return useMutation<Verification, Error, VerificationSubmitInput>({
    mutationFn: (data) =>
      api.post<Verification>("/api/verifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification"] })
      // Also update the cached user profile to reflect PENDING status
      queryClient.setQueryData<UserProfile | undefined>(
        ["userProfile"],
        (old) =>
          old ? { ...old, verificationStatus: "PENDING" as const } : old
      )
    },
  })
}
