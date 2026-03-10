// ============================================
// MessageThread — scrollable message list with auto-scroll and pagination
// ============================================

import { useEffect, useRef, useCallback, useMemo, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "./MessageBubble"
import { formatDate } from "@/lib/utils"
import type { Message } from "@/types"

interface MessageThreadProps {
  /** Messages sorted newest → oldest (from infinite query pages) */
  pages: { messages: Message[]; nextCursor: string | null; hasMore: boolean }[]
  currentUserId: string
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  fetchNextPage: () => void
}

/**
 * Scrollable message thread. Auto-scrolls to bottom on new messages,
 * shows load-more button at top for older messages.
 * Groups messages by day with date separators.
 */
export function MessageThread({
  pages,
  currentUserId,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  // Flatten and reverse so oldest → newest (API returns newest first)
  const allMessages = useMemo(() => {
    const flat = pages.flatMap((p) => p.messages)
    return [...flat].reverse()
  }, [pages])

  // Group messages by date for separators
  const grouped = useMemo(() => groupByDate(allMessages), [allMessages])

  // Auto-scroll to bottom when new messages arrive (not when loading older)
  useEffect(() => {
    const newCount = allMessages.length
    if (newCount > prevCountRef.current) {
      // Only auto-scroll if user hasn't scrolled up significantly
      const container = containerRef.current
      if (container) {
        const nearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 150
        if (nearBottom || prevCountRef.current === 0) {
          bottomRef.current?.scrollIntoView({ behavior: prevCountRef.current === 0 ? "auto" : "smooth" })
        }
      }
    }
    prevCountRef.current = newCount
  }, [allMessages.length])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Send the first message to start the conversation
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {/* Load more button at top */}
      {hasNextPage && (
        <div className="flex justify-center pt-2 pb-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="text-xs"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            ) : null}
            Load older messages
          </Button>
        </div>
      )}

      {/* Messages grouped by date */}
      <AnimatePresence mode="popLayout">
        {grouped.map(({ date, messages }) => (
          <Fragment key={date}>
            <DateSeparator date={date} />
            {messages.map((msg, idx) => {
              // Hide avatar if prev message from same sender and close in time
              const prev = idx > 0 ? messages[idx - 1] : null
              const showAvatar =
                !prev ||
                prev.senderId !== msg.senderId ||
                new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.senderId === currentUserId}
                  showAvatar={showAvatar}
                />
              )
            })}
          </Fragment>
        ))}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}

// ── Date Separator ───────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] font-medium text-muted-foreground shrink-0">
        {date}
      </span>
      <div className="flex-1 h-px bg-border" />
    </motion.div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface DateGroup {
  date: string
  messages: Message[]
}

function groupByDate(messages: Message[]): DateGroup[] {
  const groups: DateGroup[] = []

  for (const msg of messages) {
    const label = formatDate(msg.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.date === label) {
      last.messages.push(msg)
    } else {
      groups.push({ date: label, messages: [msg] })
    }
  }

  return groups
}
