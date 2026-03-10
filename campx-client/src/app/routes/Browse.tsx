// ============================================
// Browse Page — search, filter, sort, infinite scroll grid
// ============================================

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Package,
  SlidersHorizontal,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ItemGrid } from "@/components/items/ItemGrid"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { FilterSidebar } from "@/components/items/FilterSidebar"
import { useItems } from "@/hooks/useItems"
import { useDebounce } from "@/hooks/useDebounce"
import { useUserProfile } from "@/hooks"
import { SORT_OPTIONS } from "@/lib/constants"
import type { ItemFilters } from "@/types"

const DEFAULT_FILTERS: ItemFilters = {
  sort: "newest",
}

/**
 * Browse page with left filter sidebar, search, sort, and infinite-scroll grid.
 * Mobile uses a sheet overlay for filters.
 */
export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: profile } = useUserProfile()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Build filters from URL search params
  const [filters, setFilters] = useState<ItemFilters>(() => ({
    category: searchParams.get("category") ?? undefined,
    type: (searchParams.get("type") as ItemFilters["type"]) ?? undefined,
    condition: (searchParams.get("condition") as ItemFilters["condition"]) ?? undefined,
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    sort: (searchParams.get("sort") as ItemFilters["sort"]) ?? "newest",
    college: searchParams.get("college") ?? profile?.college?.slug ?? undefined,
  }))

  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? ""
  )
  const debouncedSearch = useDebounce(searchText, 300)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Merge debounced search into filters
  const activeFilters = useMemo<ItemFilters>(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
    }),
    [filters, debouncedSearch]
  )

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeFilters.category) params.set("category", activeFilters.category)
    if (activeFilters.type) params.set("type", activeFilters.type)
    if (activeFilters.condition) params.set("condition", activeFilters.condition)
    if (activeFilters.priceMin) params.set("priceMin", String(activeFilters.priceMin))
    if (activeFilters.priceMax) params.set("priceMax", String(activeFilters.priceMax))
    if (activeFilters.sort && activeFilters.sort !== "newest")
      params.set("sort", activeFilters.sort)
    if (activeFilters.search) params.set("search", activeFilters.search)
    if (activeFilters.college) params.set("college", activeFilters.college)
    setSearchParams(params, { replace: true })
  }, [activeFilters, setSearchParams])

  // Fetch items
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useItems(activeFilters)

  // Flatten all pages
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

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearchText("")
  }, [])

  const handleSortChange = useCallback(
    (value: string) => {
      setFilters((prev) => ({
        ...prev,
        sort: value as ItemFilters["sort"],
        cursor: undefined,
      }))
    },
    []
  )

  // College scope label
  const collegeLabel = profile?.college?.name ?? activeFilters.college ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Browse</h1>
            {collegeLabel && (
              <p className="text-sm text-muted-foreground">
                Showing items from{" "}
                <span className="text-primary font-medium">{collegeLabel}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort dropdown */}
            <Select
              value={filters.sort ?? "newest"}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[160px] hidden sm:flex">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile filter button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto pt-10">
                <FilterSidebar
                  filters={filters}
                  onChange={(f) => {
                    setFilters(f)
                    setMobileFilterOpen(false)
                  }}
                  onReset={() => {
                    handleResetFilters()
                    setMobileFilterOpen(false)
                  }}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main content: sidebar + grid */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Grid area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Loading */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
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
                    {(error as Error)?.message ?? "Failed to load items"}
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
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <Package className="h-16 w-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground">
                    No items found
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </motion.div>
              )}

              {/* Items grid */}
              {!isLoading && !isError && allItems.length > 0 && (
                <motion.div
                  key="items"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ItemGrid items={allItems} />

                  {/* Load more trigger */}
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
        </div>
      </div>
    </div>
  )
}
