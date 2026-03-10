import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names with clsx + tailwind-merge.
 * Use this for all conditional className constructions.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a decimal string or number as Indian Rupee currency.
 * e.g. formatPrice("1500") → "₹1,500"
 */
export function formatPrice(
  value: string | number,
  options: { sign?: boolean } = {}
): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "—"
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num)
  return options.sign && num > 0 ? `+${formatted}` : formatted
}

/**
 * Formats an ISO date string for display.
 * e.g. formatDate("2026-03-01T...") → "Mar 1, 2026"
 */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

/**
 * Formats a relative time string.
 * e.g. "2 hours ago", "yesterday"
 */
export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

/**
 * Truncates a string to maxLength, appending "..." if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

/**
 * Returns the display label for an item condition enum value.
 */
export function conditionLabel(
  condition: "NEW" | "LIKE_NEW" | "USED" | "HEAVILY_USED"
): string {
  const map: Record<string, string> = {
    NEW: "New",
    LIKE_NEW: "Like New",
    USED: "Used",
    HEAVILY_USED: "Heavily Used",
  }
  return map[condition] ?? condition
}

/**
 * Returns a colour class for a condition badge.
 */
export function conditionColor(
  condition: "NEW" | "LIKE_NEW" | "USED" | "HEAVILY_USED"
): string {
  const map: Record<string, string> = {
    NEW: "bg-green-900/40 text-green-400 border-green-800",
    LIKE_NEW: "bg-blue-900/40 text-blue-400 border-blue-800",
    USED: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
    HEAVILY_USED: "bg-red-900/40 text-red-400 border-red-800",
  }
  return map[condition] ?? ""
}

/**
 * Builds URLSearchParams from an object, omitting undefined/null values.
 */
export function buildSearchParams(
  params: Record<string, string | number | boolean | undefined | null>
): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value))
    }
  }
  return sp
}
