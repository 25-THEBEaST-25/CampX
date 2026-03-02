// ============================================
// Hook: useItems — browse, search, create, update, delete items
// ============================================

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
  Item,
  PaginatedResponse,
  ItemFilters,
  ListingType,
  ItemCondition,
} from "@/types"

// -------- Types --------

export interface CreateItemInput {
  title: string
  description?: string
  categoryId: number
  listingType: ListingType
  sellPrice?: number
  rentPricePerDay?: number
  condition: ItemCondition
  images: string[]
  pickupLocation?: string
  pickupLat?: number
  pickupLng?: number
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  status?: "AVAILABLE" | "ARCHIVED"
}

// -------- Hooks --------

/** Fetches a paginated, filterable list of items (infinite scroll) */
export function useItems(filters: ItemFilters) {
  return useInfiniteQuery<PaginatedResponse<Item>>({
    queryKey: ["items", filters],
    queryFn: ({ pageParam }) =>
      api.get<PaginatedResponse<Item>>("/api/items", {
        params: {
          ...filters,
          cursor: pageParam as string | undefined,
        },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  })
}

/** Fetches a single item by ID */
export function useItem(id: string | undefined) {
  return useQuery<Item>({
    queryKey: ["item", id],
    queryFn: () => api.get<Item>(`/api/items/${id}`),
    enabled: !!id,
  })
}

/** Fetches the current user's own listings */
export function useMyItems(status?: string) {
  return useQuery<Item[]>({
    queryKey: ["myItems", status],
    queryFn: () =>
      api.get<Item[]>("/api/users/me/items", {
        params: status ? { status } : undefined,
      }),
  })
}

/** Creates a new listing (POST /api/items) */
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateItemInput) => api.post<Item>("/api/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["myItems"] })
    },
  })
}

/** Updates an existing listing (PUT /api/items/:id) */
export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemInput }) =>
      api.put<Item>(`/api/items/${id}`, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["item", id] })
      queryClient.invalidateQueries({ queryKey: ["myItems"] })
    },
  })
}

/** Deletes (archives) a listing (DELETE /api/items/:id) */
export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["myItems"] })
    },
  })
}
