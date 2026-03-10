// ============================================
// Chat — full real-time chat page with conversation list + message thread
// ============================================

import { useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, ArrowLeft, ShieldCheck, Package } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConversationList } from "@/components/chat/ConversationList"
import { MessageThread } from "@/components/chat/MessageThread"
import { ChatInput } from "@/components/chat/ChatInput"
import {
  useConversations,
  useMessages,
  useSendMessage,
  useRealtimeMessages,
} from "@/hooks"
import { cn } from "@/lib/utils"
import type { Conversation, MessageType } from "@/types"

/**
 * Chat page.
 * Desktop: side-by-side conversation list (left) + thread (right).
 * Mobile: full-screen list → full-screen thread when a conversation is selected.
 */
export function Chat() {
  const { id: activeConversationId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentUserId = user?.id ?? ""

  // ── Data fetching ──────────────────────────────────────────────────────────

  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
  } = useConversations()

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  )

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages({
    conversationId: activeConversationId,
    enabled: !!activeConversationId,
  })

  const sendMessage = useSendMessage()

  // ── Real-time subscription ────────────────────────────────────────────────

  useRealtimeMessages(
    activeConversation?.ablyChannelName,
    activeConversationId
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectConversation = useCallback(
    (conversation: Conversation) => {
      navigate(`/chat/${conversation.id}`)
    },
    [navigate]
  )

  const handleBack = useCallback(() => {
    navigate("/chat")
  }, [navigate])

  const handleSend = useCallback(
    (content: string, type?: MessageType) => {
      if (!activeConversationId) return
      sendMessage.mutate({
        conversationId: activeConversationId,
        input: { content, type },
      })
    },
    [activeConversationId, sendMessage]
  )

  const messagePages = messagesData?.pages ?? []

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl h-[calc(100vh-10rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex h-full border border-border rounded-xl overflow-hidden bg-background">
        {/* ── Conversation sidebar ─────────────────────────────────────────── */}
        <div
          className={cn(
            "w-full sm:w-80 sm:flex sm:flex-col border-r border-border bg-card",
            activeConversationId ? "hidden sm:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-primary" size={18} />
              <h2 className="font-semibold text-foreground">Messages</h2>
              {conversations.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {conversations.length}
                </Badge>
              )}
            </div>
          </div>

          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            isLoading={isConversationsLoading}
          />
        </div>

        {/* ── Message thread area ──────────────────────────────────────────── */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            activeConversationId ? "flex" : "hidden sm:flex"
          )}
        >
          <AnimatePresence mode="wait">
            {activeConversation ? (
              <motion.div
                key={activeConversation.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Thread header */}
                <ChatHeader
                  conversation={activeConversation}
                  onBack={handleBack}
                />

                {/* Messages */}
                <MessageThread
                  pages={messagePages}
                  currentUserId={currentUserId}
                  isLoading={isMessagesLoading}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />

                {/* Input */}
                <ChatInput
                  onSend={handleSend}
                  isSending={sendMessage.isPending}
                />
              </motion.div>
            ) : (
              <EmptyState key="empty" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Chat Header ──────────────────────────────────────────────────────────────

function ChatHeader({
  conversation,
  onBack,
}: {
  conversation: Conversation
  onBack: () => void
}) {
  const { otherUser, item, transactionStatus } = conversation

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:hidden shrink-0"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={otherUser.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {otherUser.fullName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">
            {otherUser.fullName}
          </span>
          {otherUser.verificationStatus === "VERIFIED" && (
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Package className="h-3 w-3" />
          <span className="truncate">{item.title}</span>
          <span className="text-[9px]">•</span>
          <StatusLabel status={transactionStatus} />
        </div>
      </div>
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────────────────────

function StatusLabel({ status }: { status: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    REQUESTED: { label: "Requested", color: "text-yellow-400" },
    ACCEPTED: { label: "Accepted", color: "text-blue-400" },
    PAYMENT_PENDING: { label: "Payment Pending", color: "text-orange-400" },
    PAYMENT_HELD: { label: "Payment Held", color: "text-purple-400" },
    ITEM_HANDED_OVER: { label: "Handed Over", color: "text-cyan-400" },
    COMPLETED: { label: "Completed", color: "text-green-400" },
    CANCELLED: { label: "Cancelled", color: "text-red-400" },
    DISPUTED: { label: "Disputed", color: "text-red-400" },
  }

  const found = labels[status] ?? { label: status, color: "text-muted-foreground" }

  return <span className={cn("font-medium", found.color)}>{found.label}</span>
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8"
    >
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-1">
        <MessageCircle className="text-primary" size={28} />
      </div>
      <h3 className="font-medium text-foreground">Select a conversation</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Pick a conversation from the sidebar to start chatting.
        All messages are encrypted in transit.
      </p>
    </motion.div>
  )
}
