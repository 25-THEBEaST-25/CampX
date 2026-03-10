// ============================================
// ItemCardSkeleton — loading placeholder matching ItemCard layout
// ============================================

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shimmer skeleton matching the ItemCard component layout.
 * Used as loading state in browse grids.
 */
export function ItemCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}
