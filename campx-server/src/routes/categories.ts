import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

const router = Router()

/**
 * GET /api/categories
 * Returns all categories ordered by name.
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, iconName: true },
  })

  res.json({ success: true, data: categories })
})

export default router
