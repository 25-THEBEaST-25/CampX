import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate, validateQuery } from "../middleware/validate.js"
import { createNotification } from "../services/notification.js"
import { sendFundsReleasedEmail } from "../services/resend.js"
import { strictLimiter } from "../middleware/rateLimiter.js"
import { z } from "zod"

const router = Router()

// ── Validators ────────────────────────────────────────────────────────────────

const transactionsQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CAPTURED",
      "RESERVED",
      "SETTLED",
      "DISPUTED",
      "REFUNDED",
      "CANCELLED",
      "EXPIRED",
    ])
    .optional(),
})

const disputeSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
})

// ── Select helpers ────────────────────────────────────────────────────────────

const transactionSelect = {
  id: true,
  itemId: true,
  buyerId: true,
  sellerId: true,
  type: true,
  status: true,
  amount: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  rentStartDate: true,
  rentEndDate: true,
  buyerMessage: true,
  settledAt: true,
  createdAt: true,
  updatedAt: true,
  item: {
    select: {
      id: true,
      title: true,
      images: true,
      status: true,
    },
  },
  buyer: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  seller: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  conversation: {
    select: {
      id: true,
    },
  },
  reviews: {
    select: {
      id: true,
      reviewerId: true,
    },
  },
} as const

/**
 * GET /api/transactions — List current user's transactions (as buyer + seller).
 * Query: ?status=RESERVED (optional filter)
 */
router.get(
  "/",
  requireAuth,
  validateQuery(transactionsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const { status } = req.query as { status?: string }

      const where: Record<string, unknown> = {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      }

      if (status) {
        where.status = status
      }

      const transactions = await prisma.transaction.findMany({
        where,
        select: transactionSelect,
        orderBy: { createdAt: "desc" },
      })

      // Enrich transactions with hasReviewed + conversationId for the current user
      const enriched = transactions.map((txn) => {
        const hasReviewed = txn.reviews.some((r) => r.reviewerId === userId)
        return {
          ...txn,
          hasReviewed,
          conversationId: txn.conversation?.id ?? null,
          // Remove raw nested arrays that frontend doesn't need
          reviews: undefined,
          conversation: undefined,
          // Add disputeReason placeholder (stored in buyerMessage for disputes)
          disputeReason: txn.status === "DISPUTED" ? txn.buyerMessage : null,
          // Compute platformFee and sellerPayout (0% fee for now)
          platformFee: "0",
          sellerPayout: txn.amount.toString(),
        }
      })

      res.json({
        success: true,
        data: {
          transactions: enriched,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/transactions/:id — Get a single transaction (buyer or seller only).
 */
router.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const txnId = req.params.id as string

      const transaction = await prisma.transaction.findUnique({
        where: { id: txnId },
        include: {
          item: { select: { id: true, title: true, images: true, status: true } },
          buyer: { select: { id: true, fullName: true, avatarUrl: true } },
          seller: { select: { id: true, fullName: true, avatarUrl: true } },
          conversation: { select: { id: true } },
          reviews: { select: { id: true, reviewerId: true } },
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

      // Only buyer or seller can view
      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        res.status(403).json({
          success: false,
          error: "You are not a party to this transaction",
          code: "FORBIDDEN",
        })
        return
      }

      const hasReviewed = transaction.reviews.some((r) => r.reviewerId === userId)

      res.json({
        success: true,
        data: {
          id: transaction.id,
          itemId: transaction.itemId,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          razorpayOrderId: transaction.razorpayOrderId,
          razorpayPaymentId: transaction.razorpayPaymentId,
          rentStartDate: transaction.rentStartDate,
          rentEndDate: transaction.rentEndDate,
          settledAt: transaction.settledAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          item: transaction.item,
          buyer: transaction.buyer,
          seller: transaction.seller,
          hasReviewed,
          conversationId: transaction.conversation?.id ?? null,
          disputeReason: transaction.status === "DISPUTED" ? transaction.buyerMessage : null,
          platformFee: "0",
          sellerPayout: transaction.amount.toString(),
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/transactions/:id/confirm-receipt — Buyer confirms item received.
 * Releases escrow: frozenBalance -= amount, balance += amount. Sets SETTLED.
 */
router.post(
  "/:id/confirm-receipt",
  strictLimiter,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const txnId = req.params.id as string

      const transaction = await prisma.transaction.findUnique({
        where: { id: txnId },
        include: {
          item: { select: { id: true, title: true } },
          seller: { select: { id: true, fullName: true, email: true } },
          buyer: { select: { id: true, fullName: true } },
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

      // Only buyer can confirm
      if (transaction.buyerId !== userId) {
        res.status(403).json({
          success: false,
          error: "Only the buyer can confirm receipt",
          code: "FORBIDDEN",
        })
        return
      }

      // Must be RESERVED to confirm
      if (transaction.status !== "RESERVED") {
        res.status(400).json({
          success: false,
          error: `Cannot confirm receipt — transaction is ${transaction.status}`,
          code: "INVALID_STATUS",
        })
        return
      }

      // Execute fund release in a Prisma transaction
      await prisma.$transaction(async (tx) => {
        // 1. Settle the transaction
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "SETTLED",
            settledAt: new Date(),
          },
        })

        // 2. Release funds: frozenBalance -= amount, balance += amount
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: transaction.sellerId },
        })

        if (!sellerWallet) {
          throw new Error("Seller wallet not found")
        }

        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: {
            frozenBalance: { decrement: transaction.amount },
            balance: { increment: transaction.amount },
          },
        })

        // 3. Wallet transaction record: RELEASE_ESCROW
        await tx.walletTransaction.create({
          data: {
            walletId: sellerWallet.id,
            type: "RELEASE_ESCROW",
            amount: transaction.amount,
            description: `Funds released for "${transaction.item.title}"`,
            referenceId: transaction.id,
          },
        })

        // 4. Update item status
        if (transaction.type === "BUY") {
          await tx.item.update({
            where: { id: transaction.itemId },
            data: { status: "SOLD" },
          })
        } else {
          // RENT: revert to AVAILABLE after rental period (or immediately for simplicity)
          await tx.item.update({
            where: { id: transaction.itemId },
            data: { status: "AVAILABLE" },
          })
        }
      })

      // Send notifications (fire and forget)
      const notifyPromises = [
        createNotification(
          transaction.sellerId,
          "FUNDS_RELEASED",
          "Funds Released! 🎉",
          `₹${transaction.amount} for "${transaction.item.title}" has been added to your wallet.`,
          { transactionId: transaction.id, itemId: transaction.itemId }
        ),
        createNotification(
          transaction.buyerId,
          "TRANSACTION_UPDATE",
          "Transaction Complete ✅",
          `You confirmed receipt of "${transaction.item.title}". Don't forget to leave a review!`,
          { transactionId: transaction.id, itemId: transaction.itemId }
        ),
        sendFundsReleasedEmail(
          transaction.seller.email,
          transaction.seller.fullName,
          Number(transaction.amount)
        ),
      ]

      Promise.allSettled(notifyPromises).catch((err) =>
        console.error("Post-confirm notification error:", err)
      )

      res.json({
        success: true,
        message: "Item receipt confirmed. Funds released to seller.",
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/transactions/:id/dispute — Raise a dispute on a transaction.
 * Body: { reason }
 */
router.post(
  "/:id/dispute",
  strictLimiter,
  requireAuth,
  validate(disputeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const txnId = req.params.id as string
      const { reason } = req.body

      const transaction = await prisma.transaction.findUnique({
        where: { id: txnId },
        include: {
          item: { select: { id: true, title: true } },
          buyer: { select: { id: true, fullName: true } },
          seller: { select: { id: true, fullName: true } },
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

      // Only buyer or seller can dispute
      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        res.status(403).json({
          success: false,
          error: "You are not a party to this transaction",
          code: "FORBIDDEN",
        })
        return
      }

      // Can only dispute RESERVED transactions
      if (transaction.status !== "RESERVED") {
        res.status(400).json({
          success: false,
          error: `Cannot dispute — transaction is ${transaction.status}`,
          code: "INVALID_STATUS",
        })
        return
      }

      // Update transaction to DISPUTED, store reason in buyerMessage
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "DISPUTED",
          buyerMessage: reason,
        },
      })

      // Notify all parties including admin
      const disputerName =
        userId === transaction.buyerId
          ? transaction.buyer.fullName
          : transaction.seller.fullName

      const notifyPromises = [
        // Notify the other party
        createNotification(
          userId === transaction.buyerId ? transaction.sellerId : transaction.buyerId,
          "TRANSACTION_UPDATE",
          "Dispute Raised ⚠️",
          `${disputerName} raised a dispute on "${transaction.item.title}". An admin will review this.`,
          { transactionId: transaction.id, itemId: transaction.itemId }
        ),
      ]

      // Notify admin(s) about the dispute
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      })

      admins.forEach((admin) => {
        notifyPromises.push(
          createNotification(
            admin.id,
            "TRANSACTION_UPDATE",
            "New Dispute Filed 🚨",
            `${disputerName} disputed transaction for "${transaction.item.title}" — Reason: ${reason}`,
            { transactionId: transaction.id, itemId: transaction.itemId }
          )
        )
      })

      Promise.allSettled(notifyPromises).catch((err) =>
        console.error("Post-dispute notification error:", err)
      )

      res.json({
        success: true,
        message: "Dispute raised successfully. An admin will review it.",
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
