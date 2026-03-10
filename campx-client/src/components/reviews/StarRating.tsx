// ============================================
// Component: StarRating — interactive + display star rating
// ============================================

import { useState } from "react"
import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  /** Current rating value (1-5) */
  value: number
  /** Callback when a star is clicked (omit for read-only mode) */
  onChange?: (rating: number) => void
  /** Size of stars in pixels */
  size?: number
  /** Additional className */
  className?: string
}

/**
 * Animated star rating component.
 * Interactive when `onChange` is provided, read-only otherwise.
 */
export function StarRating({
  value,
  onChange,
  size = 20,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)
  const isInteractive = !!onChange

  const displayValue = isInteractive && hoverValue > 0 ? hoverValue : value

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => isInteractive && setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue
        return (
          <motion.button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => isInteractive && setHoverValue(star)}
            whileHover={isInteractive ? { scale: 1.2 } : undefined}
            whileTap={isInteractive ? { scale: 0.9 } : undefined}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: star * 0.05, duration: 0.2 }}
            className={cn(
              "transition-colors disabled:cursor-default",
              isInteractive && "cursor-pointer hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]"
            )}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors duration-200",
                filled
                  ? "fill-purple-400 text-purple-400"
                  : "fill-transparent text-zinc-600"
              )}
            />
          </motion.button>
        )
      })}
    </div>
  )
}
