// ============================================
// Report Routes — User-Facing Report Submission
// ============================================

import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { createNotification } from "../services/notification.js"
import { z } from "zod"

const router = Router()

// ── Validators ────────────────────────────────────────────────────────────────

const createReportSchema = z
  .object({
    reportedUserId: z.string().min(1).optional(),
    reportedItemId: z.string().min(1).optional(),
    reason: z.enum([
      "SPAM",
      "FAKE_LISTING",
      "INAPPROPRIATE",
      "SCAM",
      "HARASSMENT",
      "OTHER",
    ]),
    description: z.string().max(1000).optional(),
  })
  .refine(
    (data) => data.reportedUserId || data.reportedItemId,
    {
      message: "Must report at least one: a user or an item",
      path: ["reportedUserId"],
    }
  )

// ── POST /api/reports — Submit a report ───────────────────────────────────────

/**
 * POST /api/reports
 * Body: { reportedUserId?, reportedItemId?, reason, description? }
 *
 * Rules:
 * - Must specify at least one of reportedUserId or reportedItemId
 * - Cannot report yourself
 * - Reported user/item must exist
 * - Prevents duplicate pending reports from the same reporter for the same target
 */
router.post(
  "/",
  requireAuth,
  validate(createReportSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reporterId = req.user!.id
      const { reportedUserId, reportedItemId, reason, description } = req.body

      // Cannot report yourself
      if (reportedUserId && reportedUserId === reporterId) {
        res.status(400).json({
          success: false,
          error: "You cannot report yourself",
          code: "SELF_REPORT",
        })
        return
      }

      // Validate reported user exists (if provided)
      if (reportedUserId) {
        const user = await prisma.user.findUnique({
          where: { id: reportedUserId },
          select: { id: true },
        })
        if (!user) {
          res.status(404).json({
            success: false,
            error: "Reported user not found",
            code: "NOT_FOUND",
          })
          return
        }
      }

      // Validate reported item exists (if provided)
      if (reportedItemId) {
        const item = await prisma.item.findUnique({
          where: { id: reportedItemId },
          select: { id: true, sellerId: true },
        })
        if (!item) {
          res.status(404).json({
            success: false,
            error: "Reported item not found",
            code: "NOT_FOUND",
          })
          return
        }
        // Cannot report your own item
        if (item.sellerId === reporterId) {
          res.status(400).json({
            success: false,
            error: "You cannot report your own item",
            code: "SELF_REPORT",
          })
          return
        }
      }

      // Check for duplicate pending report from same reporter on same target
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId,
          status: "PENDING",
          ...(reportedUserId ? { reportedUserId } : {}),
          ...(reportedItemId ? { reportedItemId } : {}),
        },
      })

      if (existingReport) {
        res.status(409).json({
          success: false,
          error: "You already have a pending report for this target",
          code: "CONFLICT",
        })
        return
      }

      // Create the report
      const report = await prisma.report.create({
        data: {
          reporterId,
          reportedUserId: reportedUserId ?? null,
          reportedItemId: reportedItemId ?? null,
          reason,
          description: description ?? null,
        },
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      })

      // Notify admin(s) about the new report (fire and forget)
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      })

      const reporter = await prisma.user.findUnique({
        where: { id: reporterId },
        select: { fullName: true },
      })

      const reportTarget = reportedItemId
        ? `an item (${reason})`
        : `a user (${reason})`

      const notifyPromises = admins.map((admin) =>
        createNotification(
          admin.id,
          "SYSTEM",
          "New Report Filed 🚩",
          `${reporter?.fullName ?? "A user"} reported ${reportTarget}. Please review.`,
          {
            reportId: report.id,
            reportedUserId: reportedUserId ?? null,
            reportedItemId: reportedItemId ?? null,
          }
        )
      )

      Promise.allSettled(notifyPromises).catch((err) =>
        console.error("Post-report notification error:", err)
      )

      res.status(201).json({
        success: true,
        data: report,
        message: "Report submitted successfully. Our team will review it.",
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
