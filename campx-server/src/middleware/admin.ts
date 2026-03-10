import { Request, Response, NextFunction } from "express"

/**
 * Guards a route to admin users only.
 * Must be placed AFTER `requireAuth` middleware.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    })
    return
  }

  if (!req.user.isAdmin) {
    res.status(403).json({
      success: false,
      error: "Forbidden — admin access required",
      code: "FORBIDDEN",
    })
    return
  }

  next()
}
