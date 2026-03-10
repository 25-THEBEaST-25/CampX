// ============================================
// Hook: useReviews — submit review, fetch user reviews
// ============================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import type { Review, ReviewsResponse, CreateReviewInput } from "@/types"

/**
 * Fetches paginated reviews for a specific user.
 * Used on the public profile page.
 */
export function useUserReviews(userId: string | undefined, limit = 10) {
  return useInfiniteQuery<ReviewsResponse>({
    queryKey: ["reviews", userId],
    queryFn: ({ pageParam }) =>
      api.get<ReviewsResponse>(`/api/reviews/user/${userId}`, {
        params: {
          limit: String(limit),
          ...(pageParam ? { cursor: pageParam as string } : {}),
        },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!userId,
  })
}

/**
 * Submits a review for a completed transaction.
 * Invalidates transaction + review caches on success.
 */
export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      api.post<Review>("/api/reviews", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}
