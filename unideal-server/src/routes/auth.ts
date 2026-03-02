import { Router, Request, Response } from "express"
import { Webhook } from "svix"
import { prisma } from "../lib/prisma.js"
import { webhookLimiter } from "../middleware/rateLimiter.js"

const router = Router()

interface ClerkUserCreatedEvent {
  type: "user.created"
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

interface ClerkUserUpdatedEvent {
  type: "user.updated"
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserUpdatedEvent

/**
 * POST /api/webhooks/clerk
 * Receives Clerk webhook events and syncs user data to the database.
 * Handles: user.created, user.updated
 */
router.post(
  "/clerk",
  webhookLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set")
      res.status(500).json({ error: "Webhook secret not configured" })
      return
    }

    // Verify Svix signature
    const svix_id = req.headers["svix-id"] as string
    const svix_timestamp = req.headers["svix-timestamp"] as string
    const svix_signature = req.headers["svix-signature"] as string

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ error: "Missing Svix headers" })
      return
    }

    const wh = new Webhook(webhookSecret)
    let event: ClerkWebhookEvent

    try {
      event = wh.verify(JSON.stringify(req.body), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent
    } catch (err) {
      console.error("Clerk webhook signature verification failed:", err)
      res.status(400).json({ error: "Invalid webhook signature" })
      return
    }

    const { type, data } = event

    try {
      if (type === "user.created") {
        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id
        )
        const email = primaryEmail?.email_address ?? ""
        const fullName =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          "Unideal User"

        // Create user + wallet atomically
        await prisma.user.create({
          data: {
            clerkId: data.id,
            email,
            fullName,
            avatarUrl: data.image_url ?? undefined,
            wallet: { create: {} },
          },
        })

        console.log(`[Clerk webhook] Created user: ${email}`)
      }

      if (type === "user.updated") {
        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id
        )
        const email = primaryEmail?.email_address ?? undefined
        const fullName =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          undefined

        await prisma.user.update({
          where: { clerkId: data.id },
          data: {
            ...(email && { email }),
            ...(fullName && { fullName }),
            ...(data.image_url && { avatarUrl: data.image_url }),
          },
        })

        console.log(`[Clerk webhook] Updated user: ${data.id}`)
      }

      res.status(200).json({ received: true })
    } catch (err) {
      console.error("Clerk webhook DB error:", err)
      res.status(500).json({ error: "Internal error processing webhook" })
    }
  }
)

export default router
