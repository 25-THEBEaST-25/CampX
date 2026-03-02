import { z } from "zod"

export const createReviewSchema = z.object({
  transactionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
