// ============================================
// User Routes — Profile, Onboarding, Public Profiles, Listings
// ============================================

import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { onboardingSchema, updateProfileSchema } from "../validators/user.js"
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js"

const router = Router()

/**
 * GET /api/users/me — Current authenticated user profile + wallet summary
 */
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          clerkId: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          collegeId: true,
          verificationStatus: true,
          isAdmin: true,
          onboardingComplete: true,
          notificationPreferences: true,
          createdAt: true,
          college: { select: { id: true, name: true, slug: true } },
          wallet: {
            select: {
              id: true,
              balance: true,
              frozenBalance: true,
            },
          },
          _count: {
            select: {
              items: true,
              notifications: { where: { isRead: false } },
            },
          },
        },
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
          code: "NOT_FOUND",
        })
        return
      }

      res.json({
        success: true,
        data: {
          ...user,
          wallet: user.wallet
            ? {
                id: user.wallet.id,
                balance: user.wallet.balance.toString(),
                frozenBalance: user.wallet.frozenBalance.toString(),
              }
            : null,
          unreadNotificationCount: user._count.notifications,
          itemCount: user._count.items,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/users/me — Update current user profile
 */
router.put(
  "/me",
  requireAuth,
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: req.body,
        select: {
          id: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          updatedAt: true,
        },
      })

      res.json({
        success: true,
        data: updated,
        message: "Profile updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/users/onboarding — Complete onboarding after sign-up
 */
router.post(
  "/onboarding",
  requireAuth,
  validate(onboardingSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { collegeId, fullName, phone } = req.body
      const userId = req.user!.id

      // Verify college exists and is active
      const college = await prisma.college.findUnique({
        where: { id: collegeId },
        select: { id: true, isActive: true },
      })

      if (!college || !college.isActive) {
        res.status(400).json({
          success: false,
          error: "Invalid or inactive college",
          code: "INVALID_COLLEGE",
        })
        return
      }

      // Update user + ensure wallet exists
      const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            fullName,
            phone: phone ?? null,
            collegeId,
            onboardingComplete: true,
          },
          select: {
            id: true,
            fullName: true,
            phone: true,
            collegeId: true,
            onboardingComplete: true,
          },
        })

        // Create wallet if not exists
        await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId },
        })

        return user
      })

      res.json({
        success: true,
        data: updated,
        message: "Onboarding completed successfully",
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/users/me/items — Current user's listings (with optional status filter)
 */
router.get(
  "/me/items",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, cursor } = req.query
      const limit = DEFAULT_PAGE_SIZE

      const where: Record<string, unknown> = { sellerId: req.user!.id }
      if (status && typeof status === "string") {
        where.status = status.toUpperCase()
      }

      const items = await prisma.item.findMany({
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: String(cursor) } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          images: true,
          listingType: true,
          sellPrice: true,
          rentPricePerDay: true,
          condition: true,
          status: true,
          viewCount: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true, iconName: true } },
          college: { select: { id: true, name: true, slug: true } },
          _count: { select: { favorites: true } },
        },
      })

      const hasMore = items.length > limit
      const trimmed = hasMore ? items.slice(0, limit) : items
      const nextCursor = hasMore ? trimmed[trimmed.length - 1]!.id : null

      res.json({
        success: true,
        data: { items: trimmed, nextCursor, hasMore },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/users/me/notification-preferences — Get notification preferences
 */
router.get(
  "/me/notification-preferences",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { notificationPreferences: true },
      })

      // Default preferences: all enabled
      const defaults = {
        email: {
          NEW_MESSAGE: false,
          PAYMENT_RECEIVED: true,
          FUNDS_RELEASED: true,
          VERIFICATION_APPROVED: true,
          VERIFICATION_REJECTED: true,
          TRANSACTION_UPDATE: true,
          REVIEW_RECEIVED: true,
        },
        inApp: {
          NEW_MESSAGE: true,
          PAYMENT_RECEIVED: true,
          FUNDS_RELEASED: true,
          VERIFICATION_APPROVED: true,
          VERIFICATION_REJECTED: true,
          TRANSACTION_UPDATE: true,
          REVIEW_RECEIVED: true,
        },
      }

      const prefs = (user?.notificationPreferences as Record<string, unknown>) ?? {}
      const merged = {
        email: { ...defaults.email, ...(prefs.email as Record<string, boolean> ?? {}) },
        inApp: { ...defaults.inApp, ...(prefs.inApp as Record<string, boolean> ?? {}) },
      }

      res.json({ success: true, data: merged })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/users/me/notification-preferences — Update notification preferences
 */
router.put(
  "/me/notification-preferences",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, inApp } = req.body as {
        email?: Record<string, boolean>
        inApp?: Record<string, boolean>
      }

      // Fetch current prefs
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { notificationPreferences: true },
      })

      const current = (user?.notificationPreferences as Record<string, unknown>) ?? {}
      const updated = {
        email: { ...(current.email as Record<string, boolean> ?? {}), ...(email ?? {}) },
        inApp: { ...(current.inApp as Record<string, boolean> ?? {}), ...(inApp ?? {}) },
      }

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { notificationPreferences: updated },
      })

      res.json({
        success: true,
        data: updated,
        message: "Notification preferences updated",
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/users/:id — Public user profile
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id)

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          verificationStatus: true,
          createdAt: true,
          college: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              items: { where: { status: "AVAILABLE" } },
              reviewsReceived: true,
            },
          },
        },
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
          code: "NOT_FOUND",
        })
        return
      }

      // Calculate average rating
      const avgRating = await prisma.review.aggregate({
        where: { revieweeId: id },
        _avg: { rating: true },
      })

      res.json({
        success: true,
        data: {
          id: user.id,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          verificationStatus: user.verificationStatus,
          createdAt: user.createdAt,
          college: user.college,
          itemCount: user._count.items,
          reviewCount: user._count.reviewsReceived,
          avgRating: avgRating._avg.rating ?? 0,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
