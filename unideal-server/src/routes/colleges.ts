import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

const router = Router()

/**
 * GET /api/colleges
 * Returns all active colleges ordered by name.
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const colleges = await prisma.college.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      emailDomain: true,
      city: true,
      state: true,
      campusLat: true,
      campusLng: true,
      logoUrl: true,
    },
  })

  res.json({ success: true, data: colleges })
})

/**
 * GET /api/colleges/:slug
 * Returns a single college by slug.
 */
router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  const college = await prisma.college.findUnique({
    where: { slug: req.params.slug as string, isActive: true },
  })

  if (!college) {
    res.status(404).json({
      success: false,
      error: "College not found",
      code: "NOT_FOUND",
    })
    return
  }

  res.json({ success: true, data: college })
})

export default router
