import { CheckCircle2, Clock, XCircle, ShieldOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VerificationStatus } from "@/types"

interface VerificationBadgeProps {
  status: VerificationStatus
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const STATUS_CONFIG = {
  VERIFIED: {
    icon: CheckCircle2,
    label: "Verified",
    color: "text-green-400",
    bg: "bg-green-900/30 border-green-800",
  },
  PENDING: {
    icon: Clock,
    label: "Under Review",
    color: "text-yellow-400",
    bg: "bg-yellow-900/30 border-yellow-800",
  },
  REJECTED: {
    icon: XCircle,
    label: "Rejected",
    color: "text-red-400",
    bg: "bg-red-900/30 border-red-800",
  },
  UNVERIFIED: {
    icon: ShieldOff,
    label: "Unverified",
    color: "text-zinc-500",
    bg: "bg-zinc-900/30 border-zinc-700",
  },
} as const

const SIZE_MAP = {
  sm: { icon: 14, text: "text-[11px]", padding: "px-1.5 py-0.5" },
  md: { icon: 16, text: "text-xs", padding: "px-2 py-1" },
  lg: { icon: 18, text: "text-sm", padding: "px-2.5 py-1.5" },
}

/**
 * Displays a compact verification status badge with icon.
 * Used in Navbar, Profile cards, and Item detail seller section.
 */
export function VerificationBadge({
  status,
  size = "md",
  showLabel = true,
  className,
}: VerificationBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNVERIFIED
  const sizeConfig = SIZE_MAP[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        config.color,
        config.bg,
        sizeConfig.padding,
        sizeConfig.text,
        className
      )}
      title={config.label}
    >
      <Icon size={sizeConfig.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
