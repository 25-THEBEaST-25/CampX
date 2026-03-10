import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodError } from "zod"

/**
 * Validates `req.body` against a Zod schema.
 * Returns 400 with field-level error details on failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        })
        return
      }
      next(error)
    }
  }
}

/**
 * Validates `req.query` against a Zod schema.
 * Returns 400 with field-level error details on failure.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          code: "VALIDATION_ERROR",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        })
        return
      }
      next(error)
    }
  }
}
