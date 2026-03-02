// ============================================
// Hook: useOrders — Razorpay order creation + payment verification
// ============================================

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  CreateOrderInput,
  CreateOrderResponse,
  VerifyPaymentInput,
  VerifyPaymentResponse,
} from "@/types"

/** Creates a Razorpay order for an item purchase or rental */
export function useCreateOrder() {
  return useMutation({
    mutationFn: (data: CreateOrderInput) =>
      api.post<CreateOrderResponse>("/api/orders/create", data),
  })
}

/** Verifies a Razorpay payment after the checkout modal succeeds */
export function useVerifyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VerifyPaymentInput) =>
      api.post<VerifyPaymentResponse>("/api/payments/verify", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["walletHistory"] })
    },
  })
}
