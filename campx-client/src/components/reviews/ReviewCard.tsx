// ============================================
// Component: ReviewCard — displays a single user review
// ============================================

import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from "@/components/reviews/StarRating"
import { formatRelativeTime } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import type { Review } from "@/types"

interface ReviewCardProps {
  review: Review
  /** Index for stagger animation */
  index?: number
}

/**
 * Displays a single review with reviewer info, rating, comment, and optional transaction context.
 */
export function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const initials = review.reviewer.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
    >
      {/* Header: reviewer + date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.PROFILE(review.reviewer.id)}>
            <Avatar className="h-9 w-9 border border-zinc-700">
              <AvatarImage
                src={review.reviewer.avatarUrl || undefined}
                alt={review.reviewer.fullName}
              />
              <AvatarFallback className="bg-purple-500/20 text-purple-300 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              to={ROUTES.PROFILE(review.reviewer.id)}
              className="text-sm font-medium text-zinc-200 hover:text-purple-400 transition-colors"
            >
              {review.reviewer.fullName}
            </Link>
            <p className="text-xs text-zinc-500">
              {formatRelativeTime(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size={14} />
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-zinc-400 leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Transaction context */}
      {review.transaction && (
        <div className="flex items-center gap-2 pt-1">
          {review.transaction.item.images?.[0] && (
            <img
              src={review.transaction.item.images[0]}
              alt={review.transaction.item.title}
              className="h-8 w-8 rounded-md object-cover"
            />
          )}
          <Link
            to={`/items/${review.transaction.item.id}`}
            className="text-xs text-zinc-500 hover:text-purple-400 transition-colors"
          >
            {review.transaction.type === "PURCHASE" ? "Purchased" : "Rented"}:{" "}
            {review.transaction.item.title}
          </Link>
        </div>
      )}
    </motion.div>
  )
}
