// ============================================
// Shared TypeScript interfaces for Unideal
// Mirrors Prisma models + API response shapes
// ============================================

// -------- Enums --------

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
export type ListingType = "SELL" | "RENT" | "BOTH"
export type ItemCondition = "NEW" | "LIKE_NEW" | "USED" | "HEAVILY_USED"
export type ItemStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED" | "ARCHIVED"
export type TransactionStatus =
  | "PENDING"
  | "CAPTURED"
  | "RESERVED"
  | "SETTLED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED"
  | "EXPIRED"
export type TransactionType = "BUY" | "RENT"
export type WalletTransactionType =
  | "CREDIT_ESCROW"
  | "RELEASE_ESCROW"
  | "WITHDRAWAL"
  | "REFUND_DEBIT"
export type NotificationType =
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "NEW_MESSAGE"
  | "PAYMENT_RECEIVED"
  | "FUNDS_RELEASED"
  | "ITEM_SOLD"
  | "TRANSACTION_UPDATE"
  | "REVIEW_RECEIVED"
  | "SYSTEM"
export type ReportReason =
  | "SPAM"
  | "FAKE_LISTING"
  | "INAPPROPRIATE"
  | "SCAM"
  | "HARASSMENT"
  | "OTHER"
export type ReportStatus = "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED"

// -------- Entities --------

export interface College {
  id: string
  name: string
  slug: string
  emailDomain: string
  city: string
  state: string
  campusLat?: number
  campusLng?: number
  campusBoundary?: unknown
  logoUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  collegeId?: string
  college?: Pick<College, "id" | "name" | "slug" | "logoUrl">
  verificationStatus: VerificationStatus
  isAdmin: boolean
  isBanned: boolean
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
  wallet?: WalletSummary
  /** Average rating 0–5, computed from reviews */
  avgRating?: number
  reviewCount?: number
}

export interface WalletSummary {
  id: string
  balance: string
  frozenBalance: string
}

export interface WalletTransaction {
  id: string
  type: WalletTransactionType
  amount: string
  description: string
  referenceId?: string
  createdAt: string
}

export interface Category {
  id: number
  name: string
  slug: string
  iconName: string
  createdAt: string
}

export interface Item {
  id: string
  sellerId: string
  seller: Pick<UserProfile, "id" | "fullName" | "avatarUrl" | "verificationStatus" | "avgRating"> & {
    college?: Pick<College, "name" | "slug">
  }
  collegeId: string
  college: Pick<College, "id" | "name" | "slug">
  categoryId: number
  category: Pick<Category, "id" | "name" | "slug" | "iconName">
  title: string
  description?: string
  listingType: ListingType
  sellPrice?: string
  rentPricePerDay?: string
  images: string[]
  condition: ItemCondition
  status: ItemStatus
  pickupLocation?: string
  pickupLat?: number
  pickupLng?: number
  viewCount: number
  favoriteCount: number
  /** Present when user is authenticated */
  isFavorited?: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}

export interface Verification {
  id: string
  userId: string
  user?: Pick<UserProfile, "id" | "fullName" | "email" | "avatarUrl"> & {
    college?: Pick<College, "name" | "slug">
  }
  idCardImageUrl: string
  status: VerificationStatus
  reviewerNotes?: string
  reviewedAt?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  transactionId: string
  ablyChannelName: string
  lastMessageAt: string | null
  createdAt: string
  otherUser: Pick<UserProfile, "id" | "fullName" | "avatarUrl" | "verificationStatus">
  item: Pick<Item, "id" | "title" | "images">
  transactionStatus: TransactionStatus
  lastMessage: {
    id: string
    content: string
    type: MessageType
    senderId: string
    createdAt: string
  } | null
  unreadCount: number
}

export type MessageType = "TEXT" | "LOCATION" | "IMAGE" | "SYSTEM"

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  content: string
  isRead: boolean
  createdAt: string
  sender: Pick<UserProfile, "id" | "fullName" | "avatarUrl">
}

/** Conversation detail returned by GET /api/conversations/:id */
export interface ConversationDetail {
  conversation: {
    id: string
    ablyChannelName: string
    transactionId: string
    transaction: {
      id: string
      status: TransactionStatus
      item: Pick<Item, "id" | "title" | "images">
    }
    otherUser: Pick<UserProfile, "id" | "fullName" | "avatarUrl" | "verificationStatus">
  }
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}

/** Send message request body */
export interface SendMessageInput {
  type?: MessageType
  content: string
}

/** Notification preferences shape */
export interface NotificationPreferences {
  email: Record<string, boolean>
  inApp: Record<string, boolean>
}

export interface Transaction {
  id: string
  buyerId: string
  sellerId: string
  itemId: string
  item: Pick<Item, "id" | "title" | "images" | "status">
  buyer: Pick<UserProfile, "id" | "fullName" | "avatarUrl">
  seller: Pick<UserProfile, "id" | "fullName" | "avatarUrl">
  type: TransactionType
  status: TransactionStatus
  amount: string
  platformFee: string
  sellerPayout: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  rentStartDate?: string
  rentEndDate?: string
  disputeReason?: string
  settledAt?: string
  createdAt: string
  updatedAt: string
  /** Whether the current user has reviewed this transaction */
  hasReviewed?: boolean
  conversationId?: string
}

// -------- Order / Payment Types --------

export interface CreateOrderInput {
  itemId: string
  type: TransactionType
  rentStartDate?: string
  rentEndDate?: string
}

export interface CreateOrderResponse {
  orderId: string
  amount: number
  currency: string
  keyId: string
  transactionId: string
}

export interface VerifyPaymentInput {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface VerifyPaymentResponse {
  success: boolean
  transactionId: string
  conversationId?: string
}

export interface WithdrawInput {
  amount: number
}

export interface WalletInfo {
  id: string
  balance: string
  frozenBalance: string
}

export interface WalletHistoryResponse {
  transactions: WalletTransaction[]
  nextCursor?: string
  hasMore: boolean
}

export interface Review {
  id: string
  reviewerId: string
  reviewer: Pick<UserProfile, "id" | "fullName" | "avatarUrl">
  revieweeId: string
  transactionId: string
  rating: number
  comment?: string
  createdAt: string
  transaction?: {
    id: string
    type: TransactionType
    item: Pick<Item, "id" | "title" | "images">
  }
}

/** Public profile returned by GET /api/users/:id */
export interface PublicProfile {
  id: string
  fullName: string
  avatarUrl?: string
  verificationStatus: VerificationStatus
  createdAt: string
  college?: Pick<College, "id" | "name" | "slug">
  itemCount: number
  reviewCount: number
  avgRating: number
}

/** Reviews response from GET /api/reviews/user/:id */
export interface ReviewsResponse {
  reviews: Review[]
  avgRating: number
  totalReviews: number
  nextCursor: string | null
  hasMore: boolean
}

/** Create review input for POST /api/reviews */
export interface CreateReviewInput {
  transactionId: string
  rating: number
  comment?: string
}

/** Full report entity (admin views) */
export interface Report {
  id: string
  reporterId: string
  reporter?: Pick<UserProfile, "id" | "fullName" | "avatarUrl" | "email">
  reportedUserId?: string
  reportedUser?: Pick<UserProfile, "id" | "fullName" | "avatarUrl">
  reportedItemId?: string
  reportedItem?: Pick<Item, "id" | "title" | "images">
  reason: ReportReason
  description?: string
  status: ReportStatus
  adminNotes?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

/** Create report input for POST /api/reports */
export interface CreateReportInput {
  reportedUserId?: string
  reportedItemId?: string
  reason: ReportReason
  description?: string
}

/** Update profile input for PUT /api/users/me */
export interface UpdateProfileInput {
  fullName?: string
  phone?: string
  avatarUrl?: string
}

// -------- API Request / Response Types --------

export interface OnboardingInput {
  fullName: string
  phone: string
  collegeId: string
  avatarUrl?: string
}

export interface VerificationSubmitInput {
  idCardImageUrl: string
}

export interface ApiError {
  error: string
  code?: string
  statusCode: number
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
  format?: string
}

// -------- Filter / Query Types --------

export interface ItemFilters {
  cursor?: string
  category?: string
  college?: string
  sellerId?: string
  type?: ListingType
  condition?: ItemCondition
  priceMin?: number
  priceMax?: number
  search?: string
  sort?: "newest" | "oldest" | "price_low" | "price_high"
}
