// ============================================
// FilterSidebar — category, price, condition, type filters
// ============================================

import { motion } from "framer-motion"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CATEGORIES, CONDITIONS, LISTING_TYPES } from "@/lib/constants"
import type { ItemFilters, ListingType, ItemCondition } from "@/types"

interface FilterSidebarProps {
  filters: ItemFilters
  onChange: (filters: ItemFilters) => void
  onReset: () => void
  /** Whether on mobile sheet mode */
  className?: string
}

/**
 * Sidebar filter panel for the browse page.
 * Supports category, price range, condition, and listing type filters.
 */
export function FilterSidebar({
  filters,
  onChange,
  onReset,
  className,
}: FilterSidebarProps) {
  const activeCount = [
    filters.category,
    filters.type,
    filters.condition,
    filters.priceMin,
    filters.priceMax,
  ].filter(Boolean).length

  const updateFilter = <K extends keyof ItemFilters>(
    key: K,
    value: ItemFilters[K]
  ) => {
    onChange({ ...filters, [key]: value, cursor: undefined })
  }

  const toggleCategory = (slug: string) => {
    updateFilter("category", filters.category === slug ? undefined : slug)
  }

  const toggleCondition = (value: ItemCondition) => {
    updateFilter("condition", filters.condition === value ? undefined : value)
  }

  const toggleListingType = (value: ListingType) => {
    updateFilter("type", filters.type === value ? undefined : value)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-foreground text-sm">Filters</h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Category
        </Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.slug}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCategory(cat.slug)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                filters.category === cat.slug
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Price Range
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              updateFilter(
                "priceMin",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="h-8 text-xs"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              updateFilter(
                "priceMax",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Separator />

      {/* Condition */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Condition
        </Label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(({ value, label }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCondition(value as ItemCondition)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                filters.condition === value
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Listing Type */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Listing Type
        </Label>
        <div className="flex flex-wrap gap-2">
          {LISTING_TYPES.map(({ value, label }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleListingType(value as ListingType)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                filters.type === value
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
