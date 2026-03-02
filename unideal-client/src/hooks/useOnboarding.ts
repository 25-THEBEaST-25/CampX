// ============================================
// Hook: useOnboarding — submit onboarding form
// ============================================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { OnboardingInput, UserProfile } from "@/types"

/** Submits the multi-step onboarding form and invalidates the user cache */
export function useOnboarding() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, OnboardingInput>({
    mutationFn: (data) =>
      api.post<UserProfile>("/api/users/onboarding", data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["userProfile"], updatedProfile)
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
  })
}
