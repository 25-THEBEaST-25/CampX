// ============================================
// Unideal Server — Express 5 Entry Point
// ============================================

import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middleware/errorHandler.js"
import { generalLimiter, webhookLimiter } from "./middleware/rateLimiter.js"

// Route imports
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import categoryRoutes from "./routes/categories.js"
import collegeRoutes from "./routes/colleges.js"
import itemRoutes from "./routes/items.js"
import favoriteRoutes from "./routes/favorites.js"
import orderRoutes from "./routes/orders.js"
import paymentRoutes from "./routes/payments.js"
import transactionRoutes from "./routes/transactions.js"
import walletRoutes from "./routes/wallet.js"
import conversationRoutes from "./routes/conversations.js"
import verificationRoutes from "./routes/verifications.js"
import notificationRoutes from "./routes/notifications.js"
import adminRoutes from "./routes/admin.js"
import { requireAuth } from "./middleware/auth.js"
import { createTokenRequest } from "./services/ably.js"

const app = express()
const PORT = parseInt(process.env.PORT ?? "5000", 10)

// ── Global Middleware ─────────────────────────────────────────────────────────

app.use(helmet())

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
)

// Webhook endpoints need raw body for signature verification
app.use(
  "/api/webhooks",
  webhookLimiter,
  express.raw({ type: "application/json" })
)

// JSON parsing for all other routes
app.use(express.json({ limit: "10mb" }))

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("short"))
}

// General rate limiter
app.use(generalLimiter)

// ── Health Check ──────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// ── API Routes ────────────────────────────────────────────────────────────────

app.use("/api/webhooks/clerk", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/colleges", collegeRoutes)
app.use("/api/items", itemRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/verifications", verificationRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/admin", adminRoutes)

// Ably token authentication endpoint (5B.1)
app.post("/api/ably/token", requireAuth, async (req, res, next) => {
  try {
    const tokenRequest = await createTokenRequest(req.user!.id)
    res.json({ success: true, data: tokenRequest })
  } catch (error) {
    next(error)
  }
})

// ── Error Handler (must be last) ──────────────────────────────────────────────

app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Unideal server running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`)
})

export default app
