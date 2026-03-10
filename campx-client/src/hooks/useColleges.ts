// ============================================
// Hook: useColleges — fetch list of colleges
// ============================================

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { College } from "@/types"

/** Fetches all active colleges for the onboarding dropdown */
export function useColleges() {
  return useQuery<College[]>({
    queryKey: ["colleges"],
    queryFn: () => api.get<College[]>("/api/colleges"),
    staleTime: 1000 * 60 * 60, // colleges rarely change — cache 1hr
  })
}
