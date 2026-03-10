/** Default page size for cursor-based pagination */
export const DEFAULT_PAGE_SIZE = 20

/** Maximum allowed images per listing */
export const MAX_ITEM_IMAGES = 5

/** Notification types — mirrors Prisma NotificationType enum */
export const NOTIFICATION_TYPES = {
  VERIFICATION_APPROVED: "VERIFICATION_APPROVED",
  VERIFICATION_REJECTED: "VERIFICATION_REJECTED",
  NEW_MESSAGE: "NEW_MESSAGE",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  FUNDS_RELEASED: "FUNDS_RELEASED",
  ITEM_SOLD: "ITEM_SOLD",
  TRANSACTION_UPDATE: "TRANSACTION_UPDATE",
  REVIEW_RECEIVED: "REVIEW_RECEIVED",
  SYSTEM: "SYSTEM",
} as const

/** Ably channel name helpers */
export const ablyChannels = {
  userNotifications: (userId: string) => `user:${userId}:notifications`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
} as const

/** INR currency code */
export const CURRENCY = "INR"

/** Platform fee percentage (for future use) */
export const PLATFORM_FEE_PERCENT = 0
