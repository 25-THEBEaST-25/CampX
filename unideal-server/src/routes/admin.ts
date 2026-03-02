import { Router } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { requireAdmin } from "../middleware/admin.js"
import { validate } from "../middleware/validate.js"
import { createNotification } from "../services/notification.js"
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
} from "../services/resend.js"

const router = Router()

// ============================================================
// All admin routes require authentication + admin role
// ============================================================
router.use(requireAuth, requireAdmin)

// ============================================================
// Validation schemas
// ============================================================

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

const verificationActionSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  reviewerNotes: z.string().max(500).optional(),
})

const userActionSchema = z.object({
  action: z.enum(["ban", "unban", "force_verify"]),
  reason: z.string().max(500).optional(),
})

const reportActionSchema = z.object({
  action: z.enum(["action_taken", "dismissed"]),
  adminNotes: z.string().max(500).optional(),
})

const transactionInterventionSchema = z.object({
  action: z.enum(["refund", "release"]),
  adminNotes: z.string().max(500).optional(),
})

const createCollegeSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens"),
  emailDomain: z.string().min(3).max(100),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  campusLat: z.number().optional(),
  campusLng: z.number().optional(),
  logoUrl: z.string().url().optional(),
})

const updateCollegeSchema = createCollegeSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ============================================================
// GET /api/admin/stats — Dashboard overview statistics
// ============================================================
router.get("/stats", async (_req, res, next) => {
  try {
    const [
      totalUsers,
      pendingVerifications,
      activeListings,
      totalTransactions,
      escrowAggregate,
      recentSignups,
      openReports,
    ] = await Promise.all([
      prisma.user.count({ where: { isBanned: false } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.item.count({ where: { status: "AVAILABLE" } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: { in: ["RESERVED", "SETTLED"] } },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.report.count({ where: { status: "PENDING" } }),
    ])

    res.json({
      totalUsers,
      pendingVerifications,
      activeListings,
      totalTransactions,
      totalEscrow: escrowAggregate._sum.amount ?? 0,
      recentSignups,
      openReports,
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/admin/verifications — Pending verification queue
// ============================================================
router.get("/verifications", async (req, res, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const status = (req.query.status as string) ?? "PENDING"
    const skip = (page - 1) * limit

    const where = {
      ...(status !== "ALL" && {
        status: status as "PENDING" | "VERIFIED" | "REJECTED",
      }),
      ...(search && {
        user: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }),
    }

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
              college: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.verification.count({ where }),
    ])

    res.json({
      verifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/admin/verifications/:id — Approve or reject
// ============================================================
router.patch(
  "/verifications/:id",
  validate(verificationActionSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      const { status, reviewerNotes } = req.body as z.infer<typeof verificationActionSchema>

      const verification = await prisma.verification.update({
        where: { id },
        data: {
          status,
          reviewerNotes: reviewerNotes ?? null,
          reviewedBy: req.user!.id,
          reviewedAt: new Date(),
        },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      })

      // Sync the user's verification status
      await prisma.user.update({
        where: { id: verification.userId },
        data: { verificationStatus: status },
      })

      // Create in-app notification + push via Ably
      await createNotification(
        verification.userId,
        status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
        status === "VERIFIED" ? "ID Verified! 🎉" : "Verification Rejected",
        status === "VERIFIED"
          ? "Your college ID has been verified. You can now sell items on Unideal!"
          : `Your verification was rejected. Reason: ${reviewerNotes ?? "No reason provided"}`,
        { verificationId: id }
      )

      // Send email (non-blocking)
      if (status === "VERIFIED") {
        sendVerificationApprovedEmail(
          verification.user.email,
          verification.user.fullName
        ).catch(console.error)
      } else {
        sendVerificationRejectedEmail(
          verification.user.email,
          verification.user.fullName,
          reviewerNotes
        ).catch(console.error)
      }

      res.json(verification)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// GET /api/admin/users — User list with search + filter
// ============================================================
router.get("/users", async (req, res, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const filterBanned = req.query.banned === "true"
    const skip = (page - 1) * limit

    const where = {
      ...(filterBanned && { isBanned: true }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          verificationStatus: true,
          isAdmin: true,
          isBanned: true,
          onboardingComplete: true,
          createdAt: true,
          college: { select: { id: true, name: true } },
          _count: {
            select: {
              items: true,
              buyerTransactions: true,
              sellerTransactions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/admin/users/:id — Ban/unban/force-verify
// ============================================================
router.patch(
  "/users/:id",
  validate(userActionSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      const { action, reason } = req.body as z.infer<typeof userActionSchema>

      // Prevent admins from banning themselves
      if (id === req.user!.id) {
        res.status(400).json({ error: "Cannot modify your own admin account" })
        return
      }

      let updateData: Record<string, unknown> = {}
      let notificationType: string | null = null
      let notificationTitle = ""
      let notificationBody = ""

      switch (action) {
        case "ban":
          updateData = { isBanned: true }
          notificationType = "SYSTEM"
          notificationTitle = "Account Suspended"
          notificationBody = reason ?? "Your account has been suspended due to a violation of our terms."
          break
        case "unban":
          updateData = { isBanned: false }
          notificationType = "SYSTEM"
          notificationTitle = "Account Reinstated"
          notificationBody = "Your Unideal account has been reinstated. Welcome back!"
          break
        case "force_verify":
          updateData = { verificationStatus: "VERIFIED" }
          notificationType = "VERIFICATION_APPROVED"
          notificationTitle = "ID Verified (Admin)"
          notificationBody = "An admin has manually verified your account. You can now sell items!"
          break
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          fullName: true,
          email: true,
          verificationStatus: true,
          isBanned: true,
        },
      })

      if (notificationType) {
        await prisma.notification.create({
          data: {
            userId: id,
            type: notificationType as
              | "VERIFICATION_APPROVED"
              | "VERIFICATION_REJECTED"
              | "NEW_MESSAGE"
              | "PAYMENT_RECEIVED"
              | "FUNDS_RELEASED"
              | "ITEM_SOLD"
              | "TRANSACTION_UPDATE"
              | "REVIEW_RECEIVED"
              | "SYSTEM",
            title: notificationTitle,
            body: notificationBody,
          },
        })
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// GET /api/admin/reports — Reports queue
// ============================================================
router.get("/reports", async (req, res, next) => {
  try {
    const { page, limit, search: _search } = paginationSchema.parse(req.query)
    const status = (req.query.status as string) ?? "PENDING"
    const skip = (page - 1) * limit

    const where = {
      ...(status !== "ALL" && {
        status: status as "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED",
      }),
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          reportedUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          reportedItem: { select: { id: true, title: true, images: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ])

    res.json({
      reports,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/admin/reports/:id — Handle a report
// ============================================================
router.patch(
  "/reports/:id",
  validate(reportActionSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      const { action, adminNotes } = req.body as z.infer<typeof reportActionSchema>

      const report = await prisma.report.update({
        where: { id },
        data: {
          status: action === "action_taken" ? "ACTION_TAKEN" : "DISMISSED",
          adminNotes: adminNotes ?? null,
          reviewedBy: req.user!.id,
          updatedAt: new Date(),
        },
        include: {
          reporter: { select: { id: true, fullName: true } },
          reportedUser: { select: { id: true, fullName: true } },
          reportedItem: { select: { id: true, title: true } },
        },
      })

      res.json(report)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// GET /api/admin/transactions — All transactions
// ============================================================
router.get("/transactions", async (req, res, next) => {
  try {
    const { page, limit, search: _search } = paginationSchema.parse(req.query)
    const status = req.query.status as string | undefined
    const skip = (page - 1) * limit

    const where = {
      ...(status && status !== "ALL" && {
        status: status as
          | "PENDING"
          | "CAPTURED"
          | "RESERVED"
          | "SETTLED"
          | "DISPUTED"
          | "REFUNDED"
          | "CANCELLED"
          | "EXPIRED",
      }),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          item: { select: { id: true, title: true, images: true } },
          buyer: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          seller: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    res.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/admin/transactions/:id — Intervene (refund/release)
// ============================================================
router.patch(
  "/transactions/:id",
  validate(transactionInterventionSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      const { action, adminNotes: _adminNotes } = req.body as z.infer<typeof transactionInterventionSchema>

      const transaction = await prisma.transaction.findUniqueOrThrow({
        where: { id },
        include: {
          buyer: { select: { id: true, fullName: true } },
          seller: { select: { id: true, fullName: true } },
        },
      })

      if (action === "refund") {
        // Refund: reverse frozen funds back to buyer wallet, update transaction
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id },
            data: { status: "REFUNDED" },
          }),
          prisma.wallet.update({
            where: { userId: transaction.sellerId },
            data: { frozenBalance: { decrement: transaction.amount } },
          }),
          prisma.walletTransaction.create({
            data: {
              wallet: { connect: { userId: transaction.sellerId } },
              type: "REFUND_DEBIT",
              amount: transaction.amount,
              description: `Admin refund for transaction ${id}`,
              referenceId: id,
            },
          }),
          prisma.notification.create({
            data: {
              userId: transaction.buyerId,
              type: "TRANSACTION_UPDATE",
              title: "Refund Processed",
              body: `Your payment of ₹${transaction.amount} has been refunded by admin.`,
              data: { transactionId: id },
            },
          }),
        ])
      } else {
        // Release: move frozen balance to available for seller
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id },
            data: { status: "SETTLED", settledAt: new Date() },
          }),
          prisma.wallet.update({
            where: { userId: transaction.sellerId },
            data: {
              frozenBalance: { decrement: transaction.amount },
              balance: { increment: transaction.amount },
            },
          }),
          prisma.walletTransaction.create({
            data: {
              wallet: { connect: { userId: transaction.sellerId } },
              type: "RELEASE_ESCROW",
              amount: transaction.amount,
              description: `Admin manual release for transaction ${id}`,
              referenceId: id,
            },
          }),
          prisma.notification.create({
            data: {
              userId: transaction.sellerId,
              type: "FUNDS_RELEASED",
              title: "Funds Released",
              body: `₹${transaction.amount} has been released to your wallet by admin.`,
              data: { transactionId: id },
            },
          }),
        ])
      }

      const updated = await prisma.transaction.findUniqueOrThrow({
        where: { id },
        include: {
          item: { select: { id: true, title: true } },
          buyer: { select: { id: true, fullName: true } },
          seller: { select: { id: true, fullName: true } },
        },
      })

      res.json(updated)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// POST /api/admin/colleges — Create a new college
// ============================================================
router.post(
  "/colleges",
  validate(createCollegeSchema),
  async (req, res, next) => {
    try {
      const data = req.body as z.infer<typeof createCollegeSchema>

      const college = await prisma.college.create({ data })
      res.status(201).json(college)
    } catch (error) {
      next(error)
    }
  }
)

// ============================================================
// PUT /api/admin/colleges/:id — Update a college
// ============================================================
router.put(
  "/colleges/:id",
  validate(updateCollegeSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id as string
      const data = req.body as z.infer<typeof updateCollegeSchema>

      const college = await prisma.college.update({ where: { id }, data })
      res.json(college)
    } catch (error) {
      next(error)
    }
  }
)

export default router
