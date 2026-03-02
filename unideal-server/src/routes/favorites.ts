import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { AppError } from "../middleware/errorHandler.js"
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js"

const router = Router()

// ── GET /api/favorites — User's favorited items ──────────────────────────────

/**
 * GET /api/favorites
 * Returns the authenticated user's favorited items with item details.
 * Supports cursor-based pagination.
 */
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cursor, limit } = req.query as {
        cursor?: string
        limit?: string
      }

      const pageSize = limit ? Math.min(parseInt(limit, 10), 100) : DEFAULT_PAGE_SIZE

      const favorites = await prisma.favorite.findMany({
        take: pageSize + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          item: {
            select: {
              id: true,
              title: true,
              images: true,
              listingType: true,
              sellPrice: true,
              rentPricePerDay: true,
              condition: true,
              status: true,
              createdAt: true,
              seller: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                },
              },
              college: {
                select: { id: true, name: true, slug: true },
              },
              category: {
                select: { id: true, name: true, slug: true, iconName: true },
              },
              _count: { select: { favorites: true } },
            },
          },
        },
      })

      const hasMore = favorites.length > pageSize
      const trimmed = hasMore ? favorites.slice(0, pageSize) : favorites
      const nextCursor = hasMore
        ? trimmed[trimmed.length - 1].id
        : null

      const items = trimmed.map((fav) => ({
        ...fav.item,
        isFavorited: true,
        favoriteCount: fav.item._count.favorites,
        _count: undefined,
        favoritedAt: fav.createdAt,
      }))

      res.json({
        success: true,
        data: {
          items,
          nextCursor,
          hasMore,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── POST /api/favorites/:itemId — Add to favorites ───────────────────────────

/**
 * POST /api/favorites/:itemId
 * Adds an item to the user's favorites (idempotent — upsert).
 */
router.post(
  "/:itemId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.itemId)
      const userId = req.user!.id

      // Verify item exists
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true },
      })

      if (!item) {
        throw new AppError(404, "Item not found", "NOT_FOUND")
      }

      // Upsert — idempotent
      await prisma.favorite.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId },
        update: {},
      })

      res.status(201).json({
        success: true,
        message: "Added to favorites",
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── DELETE /api/favorites/:itemId — Remove from favorites ─────────────────────

/**
 * DELETE /api/favorites/:itemId
 * Removes an item from the user's favorites.
 */
router.delete(
  "/:itemId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.itemId)
      const userId = req.user!.id

      const existing = await prisma.favorite.findUnique({
        where: { userId_itemId: { userId, itemId } },
      })

      if (!existing) {
        throw new AppError(404, "Item not in favorites", "NOT_FOUND")
      }

      await prisma.favorite.delete({
        where: { userId_itemId: { userId, itemId } },
      })

      res.json({
        success: true,
        message: "Removed from favorites",
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
