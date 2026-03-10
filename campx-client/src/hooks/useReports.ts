// ============================================
// Hook: useReports — submit a report against user or item
// ============================================

import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CreateReportInput } from "@/types"

interface ReportResponse {
  id: string
  reason: string
  status: string
  createdAt: string
}

/**
 * Submits a report for a user or item.
 * Returns mutation for use in ReportModal.
 */
export function useSubmitReport() {
  return useMutation({
    mutationFn: (input: CreateReportInput) =>
      api.post<ReportResponse>("/api/reports", input),
  })
}
