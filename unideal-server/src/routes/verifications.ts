import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { AppError } from "../middleware/errorHandler.js"
import { submitVerificationSchema } from "../validators/user.js"

const router = Router()

// ── POST /api/verifications ───────────────────────────────────────────────────

/**
 * POST /api/verifications
 * Submits a college ID image for admin review.
 * Users may only have one active PENDING verification at a time.
 */
router.post(
  "/",
  requireAuth,
  validate(submitVerificationSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { idCardImageUrl } = req.body as { idCardImageUrl: string }

    // Check for existing PENDING verification
    const existing = await prisma.verification.findFirst({
      where: { userId: req.user!.id, status: "PENDING" },
    })

    if (existing) {
      throw new AppError(
        409,
        "You already have a pending verification — please wait for review",
        "VERIFICATION_PENDING"
      )
    }

    const verification = await prisma.verification.create({
      data: {
        userId: req.user!.id,
        idCardImageUrl,
        status: "PENDING",
      },
    })

    // Update user verificationStatus to PENDING
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { verificationStatus: "PENDING" },
    })

    res.status(201).json({
      success: true,
      data: verification,
      message: "Verification submitted successfully — under review",
    })
  }
)

// ── GET /api/verifications/status ─────────────────────────────────────────────

/**
 * GET /api/verifications/status
 * Returns the current user's latest verification record and overall status.
 */
router.get(
  "/status",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const latest = await prisma.verification.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        reviewerNotes: true,
        createdAt: true,
        reviewedAt: true,
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { verificationStatus: true },
    })

    res.json({
      success: true,
      data: {
        verificationStatus: user?.verificationStatus ?? "UNVERIFIED",
        latestVerification: latest ?? null,
      },
    })
  }
)

export default router
