// ============================================
// Component: ReviewForm — submit a review for a transaction
// ============================================

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/reviews/StarRating"
import { useSubmitReview } from "@/hooks/useReviews"

interface ReviewFormProps {
  /** The transaction ID to review */
  transactionId: string
  /** Optional item title for display context */
  itemTitle?: string
  /** Optional callback when review is submitted successfully */
  onSuccess?: () => void
  /** Compact mode (fewer vertical spacing) for embedding in cards */
  compact?: boolean
}

/**
 * Form to submit a star rating + optional comment for a completed transaction.
 * Includes success animation on submit.
 */
export function ReviewForm({
  transactionId,
  itemTitle,
  onSuccess,
  compact = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const submitReview = useSubmitReview()

  const handleSubmit = () => {
    if (rating === 0) return

    submitReview.mutate(
      {
        transactionId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true)
          onSuccess?.()
        },
      }
    )
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 ${compact ? "py-2" : "py-4"} justify-center`}
        >
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <span className="text-sm text-green-400 font-medium">
            Review submitted! Thank you.
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`space-y-3 ${compact ? "" : "p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"}`}
        >
          {itemTitle && (
            <p className="text-xs text-zinc-500">
              How was your experience with <span className="text-zinc-300">{itemTitle}</span>?
            </p>
          )}

          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size={24} />
            {rating > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-zinc-500"
              >
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great"}
                {rating === 5 && "Excellent"}
              </motion.span>
            )}
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)..."
            className="min-h-[72px] resize-none bg-zinc-950 border-zinc-800 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-purple-500/50"
            maxLength={500}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              {comment.length}/500
            </span>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitReview.isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {submitReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>

          {submitReview.isError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400"
            >
              Failed to submit review. Please try again.
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
