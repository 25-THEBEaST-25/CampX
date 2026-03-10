// ============================================
// Hook: useWallet — balance, history, withdraw
// ============================================

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import type {
  WalletInfo,
  WalletHistoryResponse,
  WithdrawInput,
  WalletTransactionType,
} from "@/types"

/** Fetches the current user's wallet balance info */
export function useWallet() {
  const { isSignedIn } = useAuth()

  return useQuery<WalletInfo>({
    queryKey: ["wallet"],
    queryFn: () => api.get<WalletInfo>("/api/wallet"),
    enabled: !!isSignedIn,
  })
}

/** Fetches paginated wallet transaction history with optional type filter */
export function useWalletHistory(typeFilter?: WalletTransactionType) {
  const { isSignedIn } = useAuth()

  return useInfiniteQuery<WalletHistoryResponse>({
    queryKey: ["walletHistory", typeFilter],
    queryFn: ({ pageParam }) =>
      api.get<WalletHistoryResponse>("/api/wallet/history", {
        params: {
          cursor: pageParam as string | undefined,
          type: typeFilter,
        },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!isSignedIn,
  })
}

/** Requests withdrawal from available balance */
export function useWithdraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WithdrawInput) =>
      api.post<{ success: boolean; message: string }>("/api/wallet/withdraw", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["walletHistory"] })
    },
  })
}
