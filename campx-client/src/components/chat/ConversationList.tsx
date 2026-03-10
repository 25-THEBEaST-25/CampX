// ============================================
// ConversationList — sidebar showing all user conversations
// ============================================

import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeTime, truncate, cn } from "@/lib/utils"
import type { Conversation } from "@/types"

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (conversation: Conversation) => void
  isLoading?: boolean
}

/** Sidebar list of conversations with last message preview */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <ConversationSkeleton key={i} index={i} />
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MessageCircle className="text-muted-foreground mb-3" size={32} />
        <p className="text-sm font-medium text-foreground">No conversations</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a transaction to begin chatting
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {conversations.map((conv, i) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeId}
          onSelect={onSelect}
          index={i}
        />
      ))}
    </div>
  )
}

// ── Single Conversation Item ──────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (conversation: Conversation) => void
  index: number
}

function ConversationItem({ conversation, isActive, onSelect, index }: ConversationItemProps) {
  const { otherUser, lastMessage, unreadCount, item } = conversation

  const preview = lastMessage
    ? lastMessage.type === "LOCATION"
      ? "📍 Shared a location"
      : lastMessage.type === "IMAGE"
        ? "📷 Sent an image"
        : lastMessage.type === "SYSTEM"
          ? lastMessage.content
          : truncate(lastMessage.content, 50)
    : "No messages yet"

  const timeLabel = lastMessage
    ? formatRelativeTime(lastMessage.createdAt)
    : ""

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={() => onSelect(conversation)}
      className={cn(
        "w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors",
        isActive
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/50 border border-transparent"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={otherUser.fullName} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {otherUser.fullName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-sm font-medium truncate",
            unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
          )}>
            {otherUser.fullName}
          </span>
          {timeLabel && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
              {timeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.title}
        </p>
        <p className={cn(
          "text-xs truncate mt-0.5",
          unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {preview}
        </p>
      </div>

      {unreadCount > 0 && (
        <Badge
          className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 shrink-0"
        >
          {unreadCount}
        </Badge>
      )}
    </motion.button>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ConversationSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-3 p-3 rounded-lg"
    >
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
    </motion.div>
  )
}
