import { Router, Request, Response, NextFunction } from "express"
import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { createOrderSchema } from "../validators/order.js"
import { createRazorpayOrder } from "../services/razorpay.js"
import { strictLimiter } from "../middleware/rateLimiter.js"

const router = Router()

/**
 * POST /api/orders/create — Create a Razorpay order for an item purchase or rental.
 *
 * Body: { itemId, type: BUY|RENT, rentStartDate?, rentEndDate? }
 * Returns: { orderId, amount, currency, keyId, transactionId }
 */
router.post(
  "/create",
  strictLimiter,
  requireAuth,
  validate(createOrderSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const { itemId, type, rentStartDate, rentEndDate } = req.body

      // 1. Fetch item and validate
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          sellerId: true,
          status: true,
          title: true,
          listingType: true,
          sellPrice: true,
          rentPricePerDay: true,
        },
      })

      if (!item) {
        res.status(404).json({
          success: false,
          error: "Item not found",
          code: "NOT_FOUND",
        })
        return
      }

      if (item.status !== "AVAILABLE") {
        res.status(400).json({
          success: false,
          error: "Item is no longer available",
          code: "ITEM_UNAVAILABLE",
        })
        return
      }

      // Buyer cannot be the seller
      if (item.sellerId === userId) {
        res.status(400).json({
          success: false,
          error: "You cannot buy your own item",
          code: "OWN_ITEM",
        })
        return
      }

      // Validate listing type compatibility
      if (type === "BUY" && item.listingType === "RENT") {
        res.status(400).json({
          success: false,
          error: "This item is for rent only",
          code: "INVALID_TYPE",
        })
        return
      }

      if (type === "RENT" && item.listingType === "SELL") {
        res.status(400).json({
          success: false,
          error: "This item is for sale only",
          code: "INVALID_TYPE",
        })
        return
      }

      // 2. Check for duplicate pending/reserved transactions
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          itemId,
          buyerId: userId,
          status: { in: ["PENDING", "CAPTURED", "RESERVED"] },
        },
      })

      if (existingTransaction) {
        res.status(409).json({
          success: false,
          error: "You already have an active order for this item",
          code: "DUPLICATE_ORDER",
        })
        return
      }

      // 3. Calculate amount
      let amount: Decimal

      if (type === "BUY") {
        if (!item.sellPrice) {
          res.status(400).json({
            success: false,
            error: "Item has no sell price",
            code: "NO_PRICE",
          })
          return
        }
        amount = item.sellPrice
      } else {
        // RENT
        if (!item.rentPricePerDay || !rentStartDate || !rentEndDate) {
          res.status(400).json({
            success: false,
            error: "Rent price or dates missing",
            code: "MISSING_RENT_INFO",
          })
          return
        }

        const start = new Date(rentStartDate)
        const end = new Date(rentEndDate)
        const diffMs = end.getTime() - start.getTime()
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (days < 1) {
          res.status(400).json({
            success: false,
            error: "Rental period must be at least 1 day",
            code: "INVALID_DATES",
          })
          return
        }

        amount = item.rentPricePerDay.mul(days)
      }

      // 4. Create transaction record (PENDING)
      const transaction = await prisma.transaction.create({
        data: {
          itemId,
          buyerId: userId,
          sellerId: item.sellerId,
          type,
          status: "PENDING",
          amount,
          rentStartDate: type === "RENT" ? new Date(rentStartDate) : undefined,
          rentEndDate: type === "RENT" ? new Date(rentEndDate) : undefined,
        },
      })

      // 5. Create Razorpay order
      const amountInPaise = Math.round(amount.toNumber() * 100)
      const razorpayOrder = await createRazorpayOrder(amountInPaise, transaction.id)

      // 6. Update transaction with Razorpay order ID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { razorpayOrderId: razorpayOrder.id },
      })

      res.status(201).json({
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount: amountInPaise,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID ?? "",
          transactionId: transaction.id,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
