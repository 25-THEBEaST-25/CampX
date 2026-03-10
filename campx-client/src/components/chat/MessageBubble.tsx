// ============================================
// MessageBubble — individual chat message bubble
// ============================================

import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MiniMap } from "@/components/map/MiniMap"
import { cn, formatRelativeTime } from "@/lib/utils"
import type { Message } from "@/types"

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showAvatar?: boolean
}

/**
 * Renders a single chat message. Handles TEXT, LOCATION, IMAGE, and SYSTEM types.
 * Sent messages align right (primary color), received messages align left.
 */
export function MessageBubble({ message, isMine, showAvatar = true }: MessageBubbleProps) {
  if (message.type === "SYSTEM") {
    return <SystemMessage message={message} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex items-end gap-2 max-w-[80%]",
        isMine ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      {showAvatar && !isMine ? (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={message.sender.avatarUrl ?? undefined} />
          <AvatarFallback className="text-[10px] bg-muted">
            {message.sender.fullName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <MessageContent message={message} isMine={isMine} />
        <div
          className={cn(
            "px-3 pb-1.5 text-[10px]",
            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {formatRelativeTime(message.createdAt)}
        </div>
      </div>
    </motion.div>
  )
}

// ── Content Renderer ──────────────────────────────────────────────────────────

function MessageContent({ message, isMine }: { message: Message; isMine: boolean }) {
  switch (message.type) {
    case "LOCATION":
      return <LocationContent content={message.content} isMine={isMine} />

    case "IMAGE":
      return (
        <div className="p-1">
          <img
            src={message.content}
            alt="Shared image"
            className="rounded-xl max-w-[260px] max-h-[200px] object-cover"
            loading="lazy"
          />
        </div>
      )

    case "TEXT":
    default:
      return (
        <p className="px-3 pt-2 pb-0.5 text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      )
  }
}

// ── Location Bubble ──────────────────────────────────────────────────────────

function LocationContent({ content, isMine }: { content: string; isMine: boolean }) {
  try {
    const parsed: { lat: number; lng: number; locationText?: string } = JSON.parse(content)

    return (
      <div className="p-1 space-y-1">
        <MiniMap
          lat={parsed.lat}
          lng={parsed.lng}
          zoom={15}
          height="140px"
          className="rounded-xl overflow-hidden"
        />
        {parsed.locationText && (
          <p
            className={cn(
              "text-xs px-2 pb-1 flex items-center gap-1",
              isMine ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {parsed.locationText}
          </p>
        )}
      </div>
    )
  } catch {
    return (
      <p className="px-3 pt-2 pb-0.5 text-sm">
        📍 Location shared
      </p>
    )
  }
}

// ── System Message ───────────────────────────────────────────────────────────

function SystemMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center py-2"
    >
      <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
        {message.content}
      </span>
    </motion.div>
  )
}
