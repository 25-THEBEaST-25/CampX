// ============================================
// Hook: useTransactions — list, detail, confirm receipt, dispute
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import type { Transaction, TransactionStatus } from "@/types"

interface TransactionsResponse {
  transactions: Transaction[]
}

/** Fetches the current user's transactions (as buyer and seller) */
export function useTransactions(statusFilter?: TransactionStatus) {
  const { isSignedIn } = useAuth()

  return useQuery<TransactionsResponse>({
    queryKey: ["transactions", statusFilter],
    queryFn: () =>
      api.get<TransactionsResponse>("/api/transactions", {
        params: statusFilter ? { status: statusFilter } : undefined,
      }),
    enabled: !!isSignedIn,
  })
}

/** Fetches a single transaction by ID */
export function useTransaction(id: string | undefined) {
  return useQuery<Transaction>({
    queryKey: ["transaction", id],
    queryFn: () => api.get<Transaction>(`/api/transactions/${id}`),
    enabled: !!id,
  })
}

/** Buyer confirms receipt of item — releases funds from escrow */
export function useConfirmReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId: string) =>
      api.post<{ success: boolean; message: string }>(
        `/api/transactions/${transactionId}/confirm-receipt`
      ),
    onSuccess: (_data, transactionId) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["walletHistory"] })
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["myItems"] })
    },
  })
}

/** Raises a dispute on a transaction */
export function useDisputeTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason: string }) =>
      api.post<{ success: boolean; message: string }>(
        `/api/transactions/${transactionId}/dispute`,
        { reason }
      ),
    onSuccess: (_data, { transactionId }) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] })
    },
  })
}
