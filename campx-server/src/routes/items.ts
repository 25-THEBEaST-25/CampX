import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth, requireVerified } from "../middleware/auth.js"
import { validate, validateQuery } from "../middleware/validate.js"
import { AppError } from "../middleware/errorHandler.js"
import {
  createItemSchema,
  updateItemSchema,
  browseItemsQuerySchema,
} from "../validators/item.js"
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js"
import { deleteImages } from "../services/cloudinary.js"
import { Prisma } from "@prisma/client"

const router = Router()

/** Shared select shape for item list responses */
const itemListSelect = {
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
} satisfies Prisma.ItemSelect

// ── GET /api/items — Browse with filters + cursor pagination ──────────────────

/**
 * GET /api/items
 * Browse available items with filters, search, and cursor-based pagination.
 * Optionally includes `isFavorited` boolean when the user is authenticated.
 */
router.get(
  "/",
  validateQuery(browseItemsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        cursor,
        limit,
        category,
        college,
        sellerId,
        type,
        condition,
        priceMin,
        priceMax,
        search,
        sort,
      } = req.query as Record<string, string | undefined> & {
        limit?: number
        priceMin?: number
        priceMax?: number
      }

      const pageSize =
        typeof limit === "number" ? limit : DEFAULT_PAGE_SIZE

      // Build where clause
      const where: Prisma.ItemWhereInput = { status: "AVAILABLE" }

      if (sellerId) {
        where.sellerId = sellerId
      }
      if (category) {
        where.category = { slug: category }
      }
      if (college) {
        where.college = { slug: college }
      }
      if (type) {
        where.listingType = type.toUpperCase() as "SELL" | "RENT" | "BOTH"
      }
      if (condition) {
        where.condition = condition.toUpperCase() as
          | "NEW"
          | "LIKE_NEW"
          | "USED"
          | "HEAVILY_USED"
      }
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: "insensitive" } },
          { description: { contains: String(search), mode: "insensitive" } },
        ]
      }
      if (priceMin !== undefined || priceMax !== undefined) {
        const priceFilter: Prisma.DecimalNullableFilter = {}
        if (priceMin !== undefined) priceFilter.gte = priceMin
        if (priceMax !== undefined) priceFilter.lte = priceMax

        // Combine search OR with price OR via AND
        if (where.OR) {
          const searchOr = where.OR
          where.AND = [
            { OR: searchOr },
            {
              OR: [
                { sellPrice: priceFilter },
                { rentPricePerDay: priceFilter },
              ],
            },
          ]
          delete where.OR
        } else {
          where.OR = [
            { sellPrice: priceFilter },
            { rentPricePerDay: priceFilter },
          ]
        }
      }

      // Build orderBy
      const orderBy: Prisma.ItemOrderByWithRelationInput =
        sort === "price_low"
          ? { sellPrice: "asc" }
          : sort === "price_high"
            ? { sellPrice: "desc" }
            : sort === "oldest"
              ? { createdAt: "asc" }
              : { createdAt: "desc" }

      const items = await prisma.item.findMany({
        take: pageSize + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: String(cursor) } : undefined,
        where,
        orderBy,
        select: itemListSelect,
      })

      const hasMore = items.length > pageSize
      const trimmed = hasMore ? items.slice(0, pageSize) : items
      const nextCursor = hasMore
        ? trimmed[trimmed.length - 1].id
        : null

      // If user is authenticated, check which items are favorited
      let favoriteItemIds: Set<string> = new Set()
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const { verifyToken } = await import("@clerk/backend")
          const token = authHeader.slice(7)
          const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
          })
          const user = await prisma.user.findUnique({
            where: { clerkId: payload.sub },
            select: { id: true },
          })
          if (user) {
            const favorites = await prisma.favorite.findMany({
              where: {
                userId: user.id,
                itemId: { in: trimmed.map((i) => i.id) },
              },
              select: { itemId: true },
            })
            favoriteItemIds = new Set(favorites.map((f) => f.itemId))
          }
        } catch {
          // Token invalid — proceed without favorite info
        }
      }

      const enrichedItems = trimmed.map((item) => ({
        ...item,
        isFavorited: favoriteItemIds.has(item.id),
        favoriteCount: item._count.favorites,
        _count: undefined,
      }))

      res.json({
        success: true,
        data: {
          items: enrichedItems,
          nextCursor,
          hasMore,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── GET /api/items/:id — Single item detail ───────────────────────────────────

/**
 * GET /api/items/:id
 * Returns a single item with seller info, category, favorite count.
 * Increments viewCount on each request.
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.id)

      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              verificationStatus: true,
              createdAt: true,
              college: { select: { name: true, slug: true } },
              reviewsReceived: { select: { rating: true } },
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
      })

      if (!item) {
        throw new AppError(404, "Item not found", "NOT_FOUND")
      }

      // Increment view count (fire-and-forget)
      prisma.item
        .update({
          where: { id: itemId },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {
          // Non-critical
        })

      // Compute seller average rating
      const sellerRatings = item.seller.reviewsReceived.map(
        (r: { rating: number }) => r.rating
      )
      const sellerAvgRating =
        sellerRatings.length > 0
          ? Math.round(
              (sellerRatings.reduce((a: number, b: number) => a + b, 0) /
                sellerRatings.length) *
                10
            ) / 10
          : null

      // Check if authenticated user has favorited this item
      let isFavorited = false
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const { verifyToken } = await import("@clerk/backend")
          const token = authHeader.slice(7)
          const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
          })
          const user = await prisma.user.findUnique({
            where: { clerkId: payload.sub },
            select: { id: true },
          })
          if (user) {
            const fav = await prisma.favorite.findUnique({
              where: {
                userId_itemId: { userId: user.id, itemId },
              },
            })
            isFavorited = !!fav
          }
        } catch {
          // Not authenticated — isFavorited stays false
        }
      }

      // Related items: same category, same college, excluding this item
      const relatedItems = await prisma.item.findMany({
        where: {
          id: { not: item.id },
          categoryId: item.category.id,
          collegeId: item.college.id,
          status: "AVAILABLE",
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          images: true,
          sellPrice: true,
          rentPricePerDay: true,
          listingType: true,
          condition: true,
          createdAt: true,
        },
      })

      res.json({
        success: true,
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          images: item.images,
          listingType: item.listingType,
          sellPrice: item.sellPrice,
          rentPricePerDay: item.rentPricePerDay,
          condition: item.condition,
          status: item.status,
          pickupLocation: item.pickupLocation,
          pickupLat: item.pickupLat,
          pickupLng: item.pickupLng,
          viewCount: item.viewCount,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          favoriteCount: item._count.favorites,
          isFavorited,
          seller: {
            id: item.seller.id,
            fullName: item.seller.fullName,
            avatarUrl: item.seller.avatarUrl,
            verificationStatus: item.seller.verificationStatus,
            createdAt: item.seller.createdAt,
            college: item.seller.college,
            avgRating: sellerAvgRating,
            reviewCount: sellerRatings.length,
          },
          college: item.college,
          category: item.category,
          relatedItems,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── POST /api/items — Create listing (verified only) ──────────────────────────

/**
 * POST /api/items
 * Creates a new listing. Requires the user to be college-verified.
 * Auto-sets collegeId from the user's profile.
 */
router.post(
  "/",
  requireAuth,
  requireVerified,
  validate(createItemSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { collegeId: true },
      })

      if (!user?.collegeId) {
        throw new AppError(
          400,
          "Complete onboarding first — select a college",
          "NO_COLLEGE"
        )
      }

      const {
        title,
        description,
        categoryId,
        listingType,
        sellPrice,
        rentPricePerDay,
        condition: itemCondition,
        images,
        pickupLocation,
        pickupLat,
        pickupLng,
      } = req.body

      const item = await prisma.item.create({
        data: {
          sellerId: userId,
          collegeId: user.collegeId,
          categoryId,
          title,
          description,
          listingType,
          sellPrice,
          rentPricePerDay,
          condition: itemCondition,
          images,
          pickupLocation,
          pickupLat,
          pickupLng,
        },
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
        },
      })

      res.status(201).json({
        success: true,
        data: item,
        message: "Listing created successfully",
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── PUT /api/items/:id — Update listing (owner only) ──────────────────────────

/**
 * PUT /api/items/:id
 * Updates a listing. Only the item's owner can update.
 */
router.put(
  "/:id",
  requireAuth,
  validate(updateItemSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.id)
      const userId = req.user!.id

      // Verify ownership
      const existing = await prisma.item.findUnique({
        where: { id: itemId },
        select: { sellerId: true, images: true },
      })

      if (!existing) {
        throw new AppError(404, "Item not found", "NOT_FOUND")
      }

      if (existing.sellerId !== userId) {
        throw new AppError(
          403,
          "You can only edit your own listings",
          "FORBIDDEN"
        )
      }

      const {
        title,
        description,
        categoryId,
        listingType,
        sellPrice,
        rentPricePerDay,
        condition: itemCondition,
        images,
        pickupLocation,
        pickupLat,
        pickupLng,
        status: itemStatus,
      } = req.body

      // If images were changed, clean up old images that were removed
      if (images) {
        const removedImages = existing.images.filter(
          (img: string) => !(images as string[]).includes(img)
        )
        if (removedImages.length > 0) {
          const publicIds = removedImages
            .map(extractCloudinaryPublicId)
            .filter(Boolean) as string[]
          if (publicIds.length > 0) {
            deleteImages(publicIds).catch((err: unknown) => {
              console.error("Failed to clean up old images:", err)
            })
          }
        }
      }

      const updated = await prisma.item.update({
        where: { id: itemId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(categoryId !== undefined && { categoryId }),
          ...(listingType !== undefined && { listingType }),
          ...(sellPrice !== undefined && { sellPrice }),
          ...(rentPricePerDay !== undefined && { rentPricePerDay }),
          ...(itemCondition !== undefined && { condition: itemCondition }),
          ...(images !== undefined && { images }),
          ...(pickupLocation !== undefined && { pickupLocation }),
          ...(pickupLat !== undefined && { pickupLat }),
          ...(pickupLng !== undefined && { pickupLng }),
          ...(itemStatus !== undefined && { status: itemStatus }),
        },
        select: {
          id: true,
          title: true,
          images: true,
          listingType: true,
          sellPrice: true,
          rentPricePerDay: true,
          condition: true,
          status: true,
          pickupLocation: true,
          pickupLat: true,
          pickupLng: true,
          updatedAt: true,
        },
      })

      res.json({
        success: true,
        data: updated,
        message: "Listing updated successfully",
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── DELETE /api/items/:id — Soft delete (archive) + Cloudinary cleanup ────────

/**
 * DELETE /api/items/:id
 * Soft-deletes a listing by setting status to ARCHIVED.
 * Cleans up associated Cloudinary images.
 * Only the item owner can delete.
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = String(req.params.id)
      const userId = req.user!.id

      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { sellerId: true, images: true, status: true },
      })

      if (!item) {
        throw new AppError(404, "Item not found", "NOT_FOUND")
      }

      if (item.sellerId !== userId) {
        throw new AppError(
          403,
          "You can only delete your own listings",
          "FORBIDDEN"
        )
      }

      if (item.status === "RESERVED" || item.status === "SOLD") {
        throw new AppError(
          400,
          "Cannot delete an item with an active transaction",
          "ITEM_IN_TRANSACTION"
        )
      }

      // Soft delete → set to ARCHIVED
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "ARCHIVED" },
      })

      // Clean up Cloudinary images (fire-and-forget)
      if (item.images.length > 0) {
        const publicIds = item.images
          .map(extractCloudinaryPublicId)
          .filter(Boolean) as string[]
        if (publicIds.length > 0) {
          deleteImages(publicIds).catch((err: unknown) => {
            console.error("Failed to clean up images on delete:", err)
          })
        }
      }

      res.json({
        success: true,
        message: "Listing deleted successfully",
      })
    } catch (error) {
      next(error)
    }
  }
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts a Cloudinary public_id from a full Cloudinary URL.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1234/folder/filename.jpg"
 *   → "folder/filename"
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default router
