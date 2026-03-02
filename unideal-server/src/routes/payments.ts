import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { verifyPaymentSchema } from "../validators/order.js"
import { verifyPaymentSignature, verifyWebhookSignature } from "../services/razorpay.js"
import { createNotification } from "../services/notification.js"
import { sendPaymentSecuredEmail } from "../services/resend.js"
import { strictLimiter, webhookLimiter } from "../middleware/rateLimiter.js"
import { ablyChannels } from "../lib/constants.js"

const router = Router()

/**
 * POST /api/payments/verify — Verify Razorpay payment signature after checkout.
 *
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * Returns: { success, transactionId, conversationId? }
 */
router.post(
  "/verify",
  strictLimiter,
  requireAuth,
  validate(verifyPaymentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
      const userId = req.user!.id

      // 1. Verify signature
      const isValid = verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )

      if (!isValid) {
        res.status(400).json({
          success: false,
          error: "Payment verification failed — invalid signature",
          code: "INVALID_SIGNATURE",
        })
        return
      }

      // 2. Find the transaction by Razorpay order ID
      const transaction = await prisma.transaction.findUnique({
        where: { razorpayOrderId },
        include: {
          item: { select: { id: true, title: true } },
          seller: { select: { id: true, email: true, fullName: true } },
          buyer: { select: { id: true, fullName: true } },
        },
      })

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: "Transaction not found for this order",
          code: "NOT_FOUND",
        })
        return
      }

      // Verify the current user is the buyer
      if (transaction.buyerId !== userId) {
        res.status(403).json({
          success: false,
          error: "Only the buyer can verify this payment",
          code: "FORBIDDEN",
        })
        return
      }

      // Prevent double-verification
      if (transaction.status !== "PENDING") {
        res.status(400).json({
          success: false,
          error: "This transaction has already been processed",
          code: "ALREADY_PROCESSED",
        })
        return
      }

      // 3. Execute the entire payment verification in a Prisma transaction
      const result = await prisma.$transaction(async (tx) => {
        // 3a. Update transaction status → RESERVED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "RESERVED",
            razorpayPaymentId,
            razorpaySignature,
          },
        })

        // 3b. Update item status → RESERVED
        await tx.item.update({
          where: { id: transaction.itemId },
          data: { status: "RESERVED" },
        })

        // 3c. Ensure seller has a wallet, then freeze funds
        const sellerWallet = await tx.wallet.upsert({
          where: { userId: transaction.sellerId },
          update: {
            frozenBalance: { increment: transaction.amount },
          },
          create: {
            userId: transaction.sellerId,
            balance: 0,
            frozenBalance: transaction.amount,
          },
        })

        // 3d. Create wallet transaction record (CREDIT_ESCROW)
        await tx.walletTransaction.create({
          data: {
            walletId: sellerWallet.id,
            type: "CREDIT_ESCROW",
            amount: transaction.amount,
            description: `Payment received for "${transaction.item.title}"`,
            referenceId: transaction.id,
          },
        })

        // 3e. Auto-create conversation between buyer and seller
        const conversation = await tx.conversation.create({
          data: {
            transactionId: transaction.id,
            user1Id: transaction.buyerId,
            user2Id: transaction.sellerId,
            ablyChannelName: ablyChannels.conversation(transaction.id),
          },
        })

        // 3f. Create initial system message in the conversation
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: transaction.buyerId,
            type: "SYSTEM",
            content: `Transaction started for "${transaction.item.title}". Arrange a campus meetup to exchange the item.`,
          },
        })

        return { conversation }
      })

      // 4. Send notifications (non-blocking, outside the DB transaction)
      const notifyPromises = [
        // Notify seller: payment received
        createNotification(
          transaction.sellerId,
          "PAYMENT_RECEIVED",
          "Payment Secured! 💰",
          `${transaction.buyer.fullName} paid ₹${transaction.amount} for "${transaction.item.title}". Chat to arrange meetup.`,
          { transactionId: transaction.id, itemId: transaction.itemId }
        ),
        // Notify buyer: confirmation
        createNotification(
          transaction.buyerId,
          "TRANSACTION_UPDATE",
          "Payment Confirmed ✅",
          `Your payment for "${transaction.item.title}" is secured in escrow. Chat with the seller to arrange pickup.`,
          { transactionId: transaction.id, itemId: transaction.itemId }
        ),
        // Email seller
        sendPaymentSecuredEmail(
          transaction.seller.email,
          transaction.seller.fullName,
          transaction.item.title,
          Number(transaction.amount)
        ),
      ]

      // Fire and forget – don't block the response
      Promise.allSettled(notifyPromises).catch((err) =>
        console.error("Post-verify notification error:", err)
      )

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          conversationId: result.conversation.id,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/webhooks/razorpay — Razorpay async webhook handler.
 * Handles payment.captured, payment.failed, refund.created events.
 */
router.post(
  "/webhooks/razorpay",
  webhookLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string | undefined
      const rawBody = JSON.stringify(req.body)

      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        res.status(400).json({
          success: false,
          error: "Invalid webhook signature",
          code: "INVALID_SIGNATURE",
        })
        return
      }

      const event = req.body?.event as string
      const payload = req.body?.payload

      switch (event) {
        case "payment.captured": {
          // Safety net — if verify endpoint wasn't called or failed
          const orderId = payload?.payment?.entity?.order_id as string | undefined
          if (orderId) {
            const txn = await prisma.transaction.findUnique({
              where: { razorpayOrderId: orderId },
            })
            // Only process if still PENDING (verify endpoint should have handled it)
            if (txn && txn.status === "PENDING") {
              await prisma.transaction.update({
                where: { id: txn.id },
                data: {
                  status: "CAPTURED",
                  razorpayPaymentId: payload?.payment?.entity?.id as string,
                },
              })
            }
          }
          break
        }

        case "payment.failed": {
          const orderId = payload?.payment?.entity?.order_id as string | undefined
          if (orderId) {
            await prisma.transaction.updateMany({
              where: { razorpayOrderId: orderId, status: "PENDING" },
              data: { status: "CANCELLED" },
            })
          }
          break
        }

        case "refund.created": {
          const paymentId = payload?.refund?.entity?.payment_id as string | undefined
          if (paymentId) {
            const txn = await prisma.transaction.findFirst({
              where: { razorpayPaymentId: paymentId },
            })
            if (txn && txn.status !== "REFUNDED") {
              await prisma.$transaction(async (tx) => {
                await tx.transaction.update({
                  where: { id: txn.id },
                  data: { status: "REFUNDED" },
                })

                // Deduct from seller's frozen balance
                const wallet = await tx.wallet.findUnique({
                  where: { userId: txn.sellerId },
                })
                if (wallet) {
                  await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { frozenBalance: { decrement: txn.amount } },
                  })
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      type: "REFUND_DEBIT",
                      amount: txn.amount,
                      description: "Refund processed",
                      referenceId: txn.id,
                    },
                  })
                }

                // Revert item status to AVAILABLE
                await tx.item.update({
                  where: { id: txn.itemId },
                  data: { status: "AVAILABLE" },
                })
              })
            }
          }
          break
        }

        default:
          // Ignore unrecognized events
          break
      }

      res.json({ received: true })
    } catch (error) {
      next(error)
    }
  }
)

export default router
