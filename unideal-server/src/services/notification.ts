import { NotificationType, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { publishToChannel } from "./ably.js"
import { ablyChannels } from "../lib/constants.js"

/**
 * Creates a notification record in the database and pushes it to
 * the user's Ably notifications channel in real-time.
 *
 * @param userId - Internal DB user ID
 * @param type   - NotificationType enum value
 * @param title  - Short notification title
 * @param body   - Notification body text
 * @param data   - Optional arbitrary JSON payload (e.g., itemId, transactionId)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: (data ?? {}) as Prisma.InputJsonValue },
  })

  // Push real-time update via Ably (non-fatal if this fails)
  try {
    await publishToChannel(
      ablyChannels.userNotifications(userId),
      "notification",
      {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        createdAt: notification.createdAt,
      }
    )
  } catch (err) {
    console.error("Ably publish error (non-fatal):", err)
  }
}
