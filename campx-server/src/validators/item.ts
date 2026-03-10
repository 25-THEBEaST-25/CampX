import { z } from "zod"

export const createItemSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().max(1000).optional(),
    categoryId: z.number().int().positive(),
    listingType: z.enum(["SELL", "RENT", "BOTH"]),
    sellPrice: z.number().positive().optional(),
    rentPricePerDay: z.number().positive().optional(),
    condition: z.enum(["NEW", "LIKE_NEW", "USED", "HEAVILY_USED"]),
    images: z.array(z.string().url()).min(1).max(5),
    pickupLocation: z.string().max(200).optional(),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) => {
      if (data.listingType === "SELL" || data.listingType === "BOTH")
        return !!data.sellPrice
      return true
    },
    { message: "Sell price required for SELL/BOTH listings", path: ["sellPrice"] }
  )
  .refine(
    (data) => {
      if (data.listingType === "RENT" || data.listingType === "BOTH")
        return !!data.rentPricePerDay
      return true
    },
    {
      message: "Rent price per day required for RENT/BOTH listings",
      path: ["rentPricePerDay"],
    }
  )

export const updateItemSchema = z
  .object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().max(1000).optional(),
    categoryId: z.number().int().positive().optional(),
    listingType: z.enum(["SELL", "RENT", "BOTH"]).optional(),
    sellPrice: z.number().positive().optional(),
    rentPricePerDay: z.number().positive().optional(),
    condition: z.enum(["NEW", "LIKE_NEW", "USED", "HEAVILY_USED"]).optional(),
    images: z.array(z.string().url()).min(1).max(5).optional(),
    pickupLocation: z.string().max(200).optional(),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
    status: z.enum(["AVAILABLE", "ARCHIVED"]).optional(),
  })

export const browseItemsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  college: z.string().optional(),
  sellerId: z.string().optional(),
  type: z.enum(["sell", "rent", "both"]).optional(),
  condition: z.enum(["new", "like_new", "used", "heavily_used"]).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  search: z.string().max(100).optional(),
  sort: z
    .enum(["newest", "oldest", "price_low", "price_high"])
    .default("newest"),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type BrowseItemsQuery = z.infer<typeof browseItemsQuerySchema>
