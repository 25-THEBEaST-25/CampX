// ============================================
// Hook: useFavorites — toggle, list, and manage favorited items
// ============================================

import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { Item, PaginatedResponse } from "@/types"

/** Fetches the user's favorited items (paginated) */
export function useFavorites() {
  const { isSignedIn } = useAuth()

  return useInfiniteQuery<PaginatedResponse<Item>>({
    queryKey: ["favorites"],
    queryFn: ({ pageParam }) =>
      api.get<PaginatedResponse<Item>>("/api/favorites", {
        params: { cursor: pageParam as string | undefined },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!isSignedIn,
  })
}

/** Toggles favorite with optimistic update on items and item detail caches */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      itemId,
      isFavorited,
    }: {
      itemId: string
      isFavorited: boolean
    }) =>
      isFavorited
        ? api.delete(`/api/favorites/${itemId}`)
        : api.post(`/api/favorites/${itemId}`),

    onMutate: async ({ itemId, isFavorited }) => {
      // Cancel outstanding queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["items"] })
      await queryClient.cancelQueries({ queryKey: ["item", itemId] })
      await queryClient.cancelQueries({ queryKey: ["favorites"] })

      // Snapshot current cache for rollback
      const previousItems = queryClient.getQueriesData({ queryKey: ["items"] })
      const previousItem = queryClient.getQueryData<Item>(["item", itemId])

      // Optimistic update on single item detail cache
      if (previousItem) {
        queryClient.setQueryData<Item>(["item", itemId], {
          ...previousItem,
          isFavorited: !isFavorited,
          favoriteCount: previousItem.favoriteCount + (isFavorited ? -1 : 1),
        })
      }

      // Optimistic update on infinite items cache
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Item>>>(
        { queryKey: ["items"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      isFavorited: !isFavorited,
                      favoriteCount:
                        item.favoriteCount + (isFavorited ? -1 : 1),
                    }
                  : item
              ),
            })),
          }
        }
      )

      return { previousItems, previousItem }
    },

    onError: (_err, { itemId }, context) => {
      // Rollback on error
      if (context?.previousItems) {
        for (const [queryKey, data] of context.previousItems) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      if (context?.previousItem) {
        queryClient.setQueryData(["item", itemId], context.previousItem)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
    },
  })
}
