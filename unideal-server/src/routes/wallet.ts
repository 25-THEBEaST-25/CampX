import { Router, Request, Response, NextFunction } from "express"
import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate, validateQuery } from "../middleware/validate.js"
import { strictLimiter } from "../middleware/rateLimiter.js"
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js"
import { z } from "zod"

const router = Router()

// ── Validators ────────────────────────────────────────────────────────────────

const walletHistoryQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z
    .enum(["CREDIT_ESCROW", "RELEASE_ESCROW", "WITHDRAWAL", "REFUND_DEBIT"])
    .optional(),
})

const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
})

/**
 * GET /api/wallet — Returns the current user's wallet balance + frozen balance.
 */
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id

      // Upsert wallet (ensure it exists)
      const wallet = await prisma.wallet.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          balance: 0,
          frozenBalance: 0,
        },
        select: {
          id: true,
          balance: true,
          frozenBalance: true,
        },
      })

      res.json({
        success: true,
        data: {
          id: wallet.id,
          balance: wallet.balance.toString(),
          frozenBalance: wallet.frozenBalance.toString(),
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/wallet/history — Paginated wallet transaction history with type filter.
 * Query: ?cursor, ?limit, ?type
 */
router.get(
  "/history",
  requireAuth,
  validateQuery(walletHistoryQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const { cursor, limit, type } = req.query as {
        cursor?: string
        limit?: number
        type?: string
      }

      const pageSize = Number(limit) || DEFAULT_PAGE_SIZE

      // Find wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { id: true },
      })

      if (!wallet) {
        res.json({
          success: true,
          data: {
            transactions: [],
            nextCursor: null,
            hasMore: false,
          },
        })
        return
      }

      const where: Record<string, unknown> = { walletId: wallet.id }
      if (type) {
        where.type = type
      }

      const transactions = await prisma.walletTransaction.findMany({
        take: pageSize + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          referenceId: true,
          createdAt: true,
        },
      })

      const hasMore = transactions.length > pageSize
      const items = hasMore ? transactions.slice(0, pageSize) : transactions
      const nextCursor = hasMore ? items[items.length - 1].id : null

      res.json({
        success: true,
        data: {
          transactions: items.map((t) => ({
            ...t,
            amount: t.amount.toString(),
          })),
          nextCursor,
          hasMore,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/wallet/withdraw — Request withdrawal from available balance.
 * Body: { amount }
 *
 * Note: In test mode, this creates a wallet transaction record but does not
 * trigger an actual bank payout (Razorpay Payout API requires business KYC).
 */
router.post(
  "/withdraw",
  strictLimiter,
  requireAuth,
  validate(withdrawSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const { amount } = req.body

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: "Wallet not found",
          code: "NOT_FOUND",
        })
        return
      }

      const amountDecimal = new Decimal(amount)

      if (amountDecimal.gt(wallet.balance)) {
        res.status(400).json({
          success: false,
          error: "Insufficient balance",
          code: "INSUFFICIENT_BALANCE",
        })
        return
      }

      if (amountDecimal.lte(0)) {
        res.status(400).json({
          success: false,
          error: "Amount must be positive",
          code: "INVALID_AMOUNT",
        })
        return
      }

      // Deduct balance and create wallet transaction
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: amountDecimal },
          },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL",
            amount: amountDecimal,
            description: `Withdrawal of ₹${amount} (processing)`,
          },
        })
      })

      res.json({
        success: true,
        message: `Withdrawal of ₹${amount} initiated. In test mode, no actual bank transfer will occur.`,
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
