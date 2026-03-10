// ============================================
// Conversation & Message Routes — Real-time Chat (5B.2 + 5B.3)
// ============================================

import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { publishToChannel } from "../services/ably.js"
import { createNotification } from "../services/notification.js"

const router = Router()

// ── Validators ────────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  type: z.enum(["TEXT", "LOCATION", "IMAGE"]).default("TEXT"),
  content: z.string().min(1).max(5000),
})

const messagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/conversations — List current user's conversations
 * Returns conversations with last message preview, other user info, and unread count.
 */
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
        select: {
          id: true,
          transactionId: true,
          ablyChannelName: true,
          lastMessageAt: true,
          createdAt: true,
          user1: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          user2: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          transaction: {
            select: {
              id: true,
              status: true,
              item: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              content: true,
              type: true,
              senderId: true,
              createdAt: true,
            },
          },
        },
      })

      // Count unread messages per conversation
      const unreadCounts = await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: conversations.map((c) => c.id) },
          senderId: { not: userId },
          isRead: false,
        },
        _count: { id: true },
      })

      const unreadMap = new Map(
        unreadCounts.map((u) => [u.conversationId, u._count.id])
      )

      const result = conversations.map((conv) => {
        const otherUser =
          conv.user1.id === userId ? conv.user2 : conv.user1
        const lastMessage = conv.messages[0] ?? null

        return {
          id: conv.id,
          transactionId: conv.transactionId,
          ablyChannelName: conv.ablyChannelName,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          otherUser,
          item: conv.transaction.item,
          transactionStatus: conv.transaction.status,
          lastMessage,
          unreadCount: unreadMap.get(conv.id) ?? 0,
        }
      })

      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/conversations/:id — Get messages for a conversation (paginated, newest first).
 * Also marks unread messages from the other user as read.
 */
router.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id)
      const userId = req.user!.id

      // Parse query params
      const query = messagesQuerySchema.parse(req.query)
      const { cursor, limit } = query

      // Verify user is a participant
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: {
          id: true,
          user1Id: true,
          user2Id: true,
          ablyChannelName: true,
          transactionId: true,
          transaction: {
            select: {
              id: true,
              status: true,
              item: {
                select: { id: true, title: true, images: true },
              },
            },
          },
          user1: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          user2: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
        },
      })

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: "Conversation not found",
          code: "NOT_FOUND",
        })
        return
      }

      if (
        conversation.user1Id !== userId &&
        conversation.user2Id !== userId
      ) {
        res.status(403).json({
          success: false,
          error: "You are not a participant in this conversation",
          code: "FORBIDDEN",
        })
        return
      }

      // Fetch messages (cursor-based, newest first)
      const messages = await prisma.message.findMany({
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: { conversationId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          senderId: true,
          type: true,
          content: true,
          isRead: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      })

      const hasMore = messages.length > limit
      const trimmed = hasMore ? messages.slice(0, limit) : messages
      const nextCursor = hasMore ? trimmed[trimmed.length - 1]!.id : null

      // Mark the other user's messages as read (fire and forget)
      prisma.message
        .updateMany({
          where: {
            conversationId: id,
            senderId: { not: userId },
            isRead: false,
          },
          data: { isRead: true },
        })
        .catch((err: unknown) =>
          console.error("Failed to mark messages as read:", err)
        )

      const otherUser =
        conversation.user1.id === userId
          ? conversation.user2
          : conversation.user1

      res.json({
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            ablyChannelName: conversation.ablyChannelName,
            transactionId: conversation.transactionId,
            transaction: conversation.transaction,
            otherUser,
          },
          messages: trimmed,
          nextCursor,
          hasMore,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/conversations/:id/messages — Send a message in a conversation.
 * Stores in DB, publishes to Ably channel, and creates notification for recipient.
 *
 * Body: { type: "TEXT" | "LOCATION" | "IMAGE", content: string }
 * For LOCATION type, content should be JSON: { lat, lng, locationText }
 */
router.post(
  "/:id/messages",
  requireAuth,
  validate(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id)
      const userId = req.user!.id
      const { type, content } = req.body as { type: string; content: string }

      // Verify user is a participant
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: {
          id: true,
          user1Id: true,
          user2Id: true,
          ablyChannelName: true,
        },
      })

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: "Conversation not found",
          code: "NOT_FOUND",
        })
        return
      }

      if (
        conversation.user1Id !== userId &&
        conversation.user2Id !== userId
      ) {
        res.status(403).json({
          success: false,
          error: "You are not a participant in this conversation",
          code: "FORBIDDEN",
        })
        return
      }

      const recipientId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id

      // Store message in DB + update conversation lastMessageAt
      const message = await prisma.$transaction(async (tx) => {
        const msg = await tx.message.create({
          data: {
            conversationId: id,
            senderId: userId,
            type: type as "TEXT" | "LOCATION" | "IMAGE",
            content,
          },
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            type: true,
            content: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        })
        await tx.conversation.update({
          where: { id },
          data: { lastMessageAt: new Date() },
        })
        return msg
      })

      // Publish to Ably channel (fire and forget)
      publishToChannel(conversation.ablyChannelName, "new-message", {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        type: message.type,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      }).catch((err: unknown) =>
        console.error("Ably publish error (non-fatal):", err)
      )

      // Create notification for recipient (fire and forget)
      const senderName = message.sender.fullName
      const previewContent =
        type === "LOCATION"
          ? "📍 Shared a location"
          : type === "IMAGE"
            ? "📷 Sent an image"
            : content.length > 60
              ? content.slice(0, 60) + "…"
              : content

      createNotification(
        recipientId,
        "NEW_MESSAGE",
        `Message from ${senderName}`,
        previewContent,
        { conversationId: id }
      ).catch((err: unknown) =>
        console.error("Notification error (non-fatal):", err)
      )

      res.status(201).json({
        success: true,
        data: message,
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
