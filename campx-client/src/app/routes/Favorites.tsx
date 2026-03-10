// ============================================
// Favorites Page — user's saved items with infinite scroll
// ============================================

import { useEffect, useRef, useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Package, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { ItemGrid } from "@/components/items/ItemGrid"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { useFavorites } from "@/hooks/useFavorites"
import { ROUTES } from "@/lib/constants"

/**
 * Favorites page — shows all items the user has hearted.
 * Uses infinite scroll with IntersectionObserver.
 */
export function Favorites() {
  const { isSignedIn } = useAuth()
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFavorites()

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const allItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  )

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="text-primary" size={24} />
          <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Heart className="text-muted-foreground" size={48} />
          <h3 className="text-lg font-medium text-foreground">Sign in to see your favorites</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Create an account to save items and access them later.
          </p>
          <Button asChild>
            <Link to={ROUTES.SIGN_IN}>Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="text-primary" size={24} />
        <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
        {allItems.length > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {allItems.length} item{allItems.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </motion.div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive text-sm">
              {(error as Error)?.message ?? "Failed to load favorites"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Empty */}
        {!isLoading && !isError && allItems.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Package className="text-muted-foreground" size={48} />
            <h3 className="text-lg font-medium text-foreground">No favorites yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Items you heart will appear here. Browse listings to find something you like.
            </p>
            <Button asChild variant="outline">
              <Link to={ROUTES.BROWSE}>Browse Marketplace</Link>
            </Button>
          </motion.div>
        )}

        {/* Items */}
        {!isLoading && !isError && allItems.length > 0 && (
          <motion.div
            key="items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ItemGrid items={allItems} />

            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              {hasNextPage && !isFetchingNextPage && (
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                >
                  Load More
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
