// ============================================
// App-wide constants
// ============================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001"

// -------- Categories --------
export const CATEGORIES = [
  { id: 1, name: "Textbooks", slug: "textbooks", iconName: "BookOpen" },
  { id: 2, name: "Electronics", slug: "electronics", iconName: "Laptop" },
  { id: 3, name: "Furniture", slug: "furniture", iconName: "Armchair" },
  { id: 4, name: "Sports & Fitness", slug: "sports", iconName: "Dumbbell" },
  { id: 5, name: "Clothing", slug: "clothing", iconName: "Shirt" },
  { id: 6, name: "Miscellaneous", slug: "misc", iconName: "Package" },
] as const

// -------- Conditions --------
export const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "USED", label: "Used" },
  { value: "HEAVILY_USED", label: "Heavily Used" },
] as const

// -------- Listing types --------
export const LISTING_TYPES = [
  { value: "SELL", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
  { value: "BOTH", label: "Sale & Rent" },
] as const

// -------- Sort options --------
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
] as const

// -------- Image upload limits --------
export const MAX_ITEM_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 10
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

// -------- Pagination --------
export const DEFAULT_PAGE_SIZE = 20

// -------- Item status labels --------
export const ITEM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
  ARCHIVED: "Archived",
}

// -------- Verification status labels --------
export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  UNVERIFIED: "Not Verified",
  PENDING: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
}

// -------- Transaction status labels --------
export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Payment Pending",
  CAPTURED: "Payment Captured",
  RESERVED: "Funds in Escrow",
  SETTLED: "Completed",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
}

export const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  CAPTURED: "bg-blue-900/40 text-blue-400 border-blue-800",
  RESERVED: "bg-blue-900/40 text-blue-400 border-blue-800",
  SETTLED: "bg-green-900/40 text-green-400 border-green-800",
  DISPUTED: "bg-red-900/40 text-red-400 border-red-800",
  REFUNDED: "bg-orange-900/40 text-orange-400 border-orange-800",
  CANCELLED: "bg-zinc-800/40 text-zinc-400 border-zinc-700",
  EXPIRED: "bg-zinc-800/40 text-zinc-400 border-zinc-700",
}

// -------- Wallet transaction type labels --------
export const WALLET_TX_LABELS: Record<string, string> = {
  CREDIT_ESCROW: "Payment Received (Escrow)",
  RELEASE_ESCROW: "Escrow Released",
  WITHDRAWAL: "Withdrawal",
  REFUND_DEBIT: "Refund",
}

export const WALLET_TX_ICONS: Record<string, string> = {
  CREDIT_ESCROW: "ArrowDownLeft",
  RELEASE_ESCROW: "ArrowUpRight",
  WITHDRAWAL: "ArrowDownRight",
  REFUND_DEBIT: "ArrowUpLeft",
}

// -------- Report reason labels --------
export const REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: "Spam or misleading",
  FAKE_LISTING: "Fake / counterfeit listing",
  INAPPROPRIATE: "Inappropriate content",
  SCAM: "Scam or fraud",
  HARASSMENT: "Harassment or abuse",
  OTHER: "Other",
}

export const REPORT_REASONS = [
  { value: "SPAM", label: "Spam or misleading" },
  { value: "FAKE_LISTING", label: "Fake / counterfeit listing" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "SCAM", label: "Scam or fraud" },
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "OTHER", label: "Other" },
] as const

// -------- Routes --------
export const ROUTES = {
  HOME: "/",
  BROWSE: "/browse",
  ITEM_DETAIL: (id: string) => `/items/${id}`,
  SELL: "/sell",
  DASHBOARD: "/dashboard",
  CHAT: "/chat",
  CHAT_THREAD: (id: string) => `/chat/${id}`,
  WALLET: "/wallet",
  PROFILE: (id: string) => `/profile/${id}`,
  SETTINGS: "/settings",
  ONBOARDING: "/onboarding",
  VERIFICATION: "/verification",
  FAVORITES: "/favorites",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const
