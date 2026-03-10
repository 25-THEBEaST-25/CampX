import { Request, Response, NextFunction } from "express"

/** Structured error with an HTTP status code */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "INTERNAL_ERROR"
  ) {
    super(message)
    this.name = "AppError"
  }
}

/**
 * Global Express error handler.
 * Must be registered LAST in the middleware chain.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    })
    return
  }

  // Prisma known request errors
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const prismaErr = err as { code: string; meta?: { target?: string[] } }

    if (prismaErr.code === "P2002") {
      const field = prismaErr.meta?.target?.[0] ?? "field"
      res.status(409).json({
        success: false,
        error: `${field} already exists`,
        code: "DUPLICATE_ENTRY",
      })
      return
    }

    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        error: "Record not found",
        code: "NOT_FOUND",
      })
      return
    }
  }

  // Unknown error
  console.error("Unhandled error:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  })
}
