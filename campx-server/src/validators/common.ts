import { z } from "zod"

/** Standard cursor-based pagination query params */
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/** Helper — cuid-style or any non-empty string ID */
export const idParamSchema = z.object({
  id: z.string().min(1),
})

export type PaginationQuery = z.infer<typeof paginationSchema>
