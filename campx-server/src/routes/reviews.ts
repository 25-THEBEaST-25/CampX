// ============================================
// Review Routes — Submit & Fetch Reviews
// ============================================

import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate, validateQuery } from "../middleware/validate.js"
import { createReviewSchema } from "../validators/review.js"
import { createNotification } from "../services/notification.js"
import { sendReviewReceivedEmail } from "../services/resend.js"
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js"
import { z } from "zod"

const router = Router()

// ── Validators ────────────────────────────────────────────────────────────────

const userReviewsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DEFAULT_PAGE_SIZE),
})

// ── POST /api/reviews — Submit a review for a settled transaction ─────────────

/**
 * POST /api/reviews
 * Body: { transactionId, rating (1-5), comment? }
 *
 * Rules:
 * - Transaction must be SETTLED
 * - Reviewer must be buyer OR seller in the transaction
 * - Cannot review twice (unique constraint: transactionId + reviewerId)
 * - Reviewee is the other party in the transaction
 */
router.post(
  "/",
  requireAuth,
  validate(createReviewSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const { transactionId, rating, comment } = req.body

      // Fetch the transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          item: { select: { id: true, title: true } },
          buyer: { select: { id: true, fullName: true, email: true } },
          seller: { select: { id: true, fullName: true, email: true } },
        },
      })

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: "Transaction not found",
          code: "NOT_FOUND",
        })
        return
      }

      // Verify user is buyer or seller
      const isBuyer = transaction.buyerId === userId
      const isSeller = transaction.sellerId === userId

      if (!isBuyer && !isSeller) {
        res.status(403).json({
          success: false,
          error: "You are not a party to this transaction",
          code: "FORBIDDEN",
        })
        return
      }

      // Transaction must be settled
      if (transaction.status !== "SETTLED") {
        res.status(400).json({
          success: false,
          error: "Can only review settled transactions",
          code: "INVALID_STATUS",
        })
        return
      }

      // Check for duplicate review (unique constraint will also catch this)
      const existingReview = await prisma.review.findUnique({
        where: {
          transactionId_reviewerId: {
            transactionId,
            reviewerId: userId,
          },
        },
      })

      if (existingReview) {
        res.status(409).json({
          success: false,
          error: "You have already reviewed this transaction",
          code: "CONFLICT",
        })
        return
      }

      // Determine reviewee (the other party)
      const revieweeId = isBuyer ? transaction.sellerId : transaction.buyerId
      const reviewee = isBuyer ? transaction.seller : transaction.buyer
      const reviewer = isBuyer ? transaction.buyer : transaction.seller

      // Create the review
      const review = await prisma.review.create({
        data: {
          transactionId,
          reviewerId: userId,
          revieweeId,
          rating,
          comment: comment ?? null,
        },
        select: {
          id: true,
          transactionId: true,
          reviewerId: true,
          revieweeId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      })

      // Send notification + email to the reviewee (fire and forget)
      const notifyPromises = [
        createNotification(
          revieweeId,
          "REVIEW_RECEIVED",
          "New Review Received ⭐",
          `${reviewer.fullName} left you a ${rating}-star review${comment ? `: "${comment.substring(0, 80)}${comment.length > 80 ? "..." : ""}"` : ""}`,
          {
            reviewId: review.id,
            transactionId,
            itemId: transaction.item.id,
            rating,
          }
        ),
        sendReviewReceivedEmail(
          revieweeId,
          reviewee.email,
          reviewee.fullName,
          reviewer.fullName,
          rating,
          comment ?? null,
          transaction.item.title
        ),
      ]

      Promise.allSettled(notifyPromises).catch((err) =>
        console.error("Post-review notification error:", err)
      )

      res.status(201).json({
        success: true,
        data: review,
        message: "Review submitted successfully",
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── GET /api/reviews/user/:id — Paginated reviews for a user ─────────────────

/**
 * GET /api/reviews/user/:id
 * Query: ?cursor=string&limit=20
 *
 * Returns reviews where the user is the reviewee, with reviewer info.
 * Public endpoint (no auth required).
 */
router.get(
  "/user/:id",
  validateQuery(userReviewsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const revieweeId = req.params.id as string
      const { cursor, limit } = req.query as unknown as { cursor?: string; limit: number }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: revieweeId },
        select: { id: true },
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
          code: "NOT_FOUND",
        })
        return
      }

      const reviews = await prisma.review.findMany({
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: { revieweeId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          transaction: {
            select: {
              id: true,
              type: true,
              item: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                },
              },
            },
          },
        },
      })

      const hasMore = reviews.length > limit
      const trimmed = hasMore ? reviews.slice(0, limit) : reviews
      const nextCursor = hasMore ? trimmed[trimmed.length - 1]!.id : null

      // Also return aggregate rating stats
      const aggregate = await prisma.review.aggregate({
        where: { revieweeId },
        _avg: { rating: true },
        _count: { _all: true },
      })

      res.json({
        success: true,
        data: {
          reviews: trimmed,
          avgRating: aggregate._avg.rating ?? 0,
          totalReviews: aggregate._count._all,
          nextCursor,
          hasMore,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
