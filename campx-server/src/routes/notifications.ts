// ============================================
// Notification Routes — CRUD + Mark-as-Read (5B.4)
// ============================================

import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js"

const router = Router()

// ── Validators ────────────────────────────────────────────────────────────────

const notificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  unreadOnly: z.coerce.boolean().default(false),
})

const markReadSchema = z.union([
  z.object({
    all: z.literal(true),
  }),
  z.object({
    ids: z.array(z.string().cuid()).min(1).max(100),
  }),
])

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/notifications — List current user's notifications (cursor-based pagination).
 * Query: { cursor?, limit?, unreadOnly? }
 */
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const query = notificationsQuerySchema.parse(req.query)
      const { cursor, limit, unreadOnly } = query

      const where = {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      }

      const notifications = await prisma.notification.findMany({
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          isRead: true,
          createdAt: true,
        },
      })

      const hasMore = notifications.length > limit
      const trimmed = hasMore ? notifications.slice(0, limit) : notifications
      const nextCursor = hasMore
        ? trimmed[trimmed.length - 1]!.id
        : null

      // Also return total unread count
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      })

      res.json({
        success: true,
        data: {
          notifications: trimmed,
          unreadCount,
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
 * PATCH /api/notifications/read — Mark notifications as read.
 * Body: { ids: string[] } OR { all: true }
 */
router.patch(
  "/read",
  requireAuth,
  validate(markReadSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const body = req.body as { all?: true; ids?: string[] }

      const where = body.all
        ? { userId, isRead: false }
        : { userId, id: { in: body.ids }, isRead: false }

      const result = await prisma.notification.updateMany({
        where,
        data: { isRead: true },
      })

      res.json({
        success: true,
        data: {
          markedRead: result.count,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/notifications/:id — Delete a single notification.
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id
      const id = String(req.params.id)

      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (!notification) {
        res.status(404).json({
          success: false,
          error: "Notification not found",
          code: "NOT_FOUND",
        })
        return
      }

      if (notification.userId !== userId) {
        res.status(403).json({
          success: false,
          error: "Not your notification",
          code: "FORBIDDEN",
        })
        return
      }

      await prisma.notification.delete({ where: { id } })

      res.json({ success: true, data: { deleted: true } })
    } catch (error) {
      next(error)
    }
  }
)

export default router
