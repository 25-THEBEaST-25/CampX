import rateLimit from "express-rate-limit"

/** General API rate limiter: 100 req / 15 min per IP */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests — please try again later",
    code: "RATE_LIMITED",
  },
})

/** Strict limiter for auth/sensitive routes: 20 req / 15 min per IP */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests — please try again later",
    code: "RATE_LIMITED",
  },
})

/** Webhook limiter: 200 req / 15 min (Clerk/Razorpay post frequently) */
export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
