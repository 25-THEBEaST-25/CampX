import { Request, Response, NextFunction } from "express"
import { verifyToken } from "@clerk/backend"
import { prisma } from "../lib/prisma.js"

/**
 * Verifies Clerk session JWT from `Authorization: Bearer <token>` header.
 * Attaches `req.user` with DB user data including isAdmin and verificationStatus.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Unauthorized — missing token",
      code: "UNAUTHORIZED",
    })
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })
    const clerkId = payload.sub

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        isAdmin: true,
        isBanned: true,
        verificationStatus: true,
        onboardingComplete: true,
      },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found — please sign in again",
        code: "USER_NOT_FOUND",
      })
      return
    }

    if (user.isBanned) {
      res.status(403).json({
        success: false,
        error: "Your account has been suspended",
        code: "ACCOUNT_BANNED",
      })
      return
    }

    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      isAdmin: user.isAdmin,
      verificationStatus: user.verificationStatus,
      onboardingComplete: user.onboardingComplete,
    }

    next()
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      code: "INVALID_TOKEN",
    })
  }
}

/**
 * Requires the authenticated user to have VERIFIED status.
 * Must be placed AFTER `requireAuth` middleware.
 */
export function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.verificationStatus !== "VERIFIED") {
    res.status(403).json({
      success: false,
      error: "College verification required to perform this action",
      code: "NOT_VERIFIED",
    })
    return
  }
  next()
}
