// ============================================
// Hook: useChat — conversations, messages, and real-time subscriptions
// ============================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import { subscribeToChannel, connectAbly, disconnectAbly } from "@/lib/ably"
import type {
  Conversation,
  ConversationDetail,
  Message,
  SendMessageInput,
} from "@/types"

// ── Conversation List ─────────────────────────────────────────────────────────

/** Fetches all conversations for the current user */
export function useConversations() {
  const { isSignedIn } = useAuth()

  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/api/conversations"),
    enabled: !!isSignedIn,
    refetchInterval: 30_000, // Poll every 30s as backup to real-time
  })
}

// ── Conversation Messages (paginated, infinite scroll) ────────────────────────

interface UseMessagesOptions {
  conversationId: string | undefined
  enabled?: boolean
}

/** Fetches paginated messages for a conversation (newest first) */
export function useMessages({ conversationId, enabled = true }: UseMessagesOptions) {
  return useInfiniteQuery<ConversationDetail>({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 30 }
      if (pageParam) params.cursor = pageParam as string
      return api.get<ConversationDetail>(
        `/api/conversations/${conversationId}`,
        { params }
      )
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!conversationId && enabled,
  })
}

// ── Send Message ──────────────────────────────────────────────────────────────

interface SendMessageArgs {
  conversationId: string
  input: SendMessageInput
}

/** Sends a message in a conversation */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation<Message, Error, SendMessageArgs>({
    mutationFn: async ({ conversationId, input }) => {
      return api.post<Message>(
        `/api/conversations/${conversationId}/messages`,
        input
      )
    },
    onSuccess: (_data, { conversationId }) => {
      // Invalidate conversations list to update lastMessage preview + order
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      // Invalidate messages to add the new message (will be merged with optimistic below)
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
    },
  })
}

// ── Real-time Subscription Hook ───────────────────────────────────────────────

/**
 * Subscribes to real-time messages on an Ably channel.
 * Automatically adds new messages to the React Query cache.
 */
export function useRealtimeMessages(
  ablyChannelName: string | undefined,
  conversationId: string | undefined
) {
  const queryClient = useQueryClient()
  const channelRef = useRef(ablyChannelName)
  channelRef.current = ablyChannelName

  useEffect(() => {
    if (!ablyChannelName || !conversationId) return

    connectAbly()

    const unsubscribe = subscribeToChannel(
      ablyChannelName,
      "new-message",
      (ablyMessage) => {
        const msg = ablyMessage.data as Message

        // Add to messages cache (prepend since newest first)
        queryClient.setQueryData(
          ["messages", conversationId],
          (oldData: { pages: ConversationDetail[]; pageParams: unknown[] } | undefined) => {
            if (!oldData || !oldData.pages[0]) return oldData

            const firstPage = oldData.pages[0]
            // Avoid duplicates
            const exists = firstPage.messages.some((m) => m.id === msg.id)
            if (exists) return oldData

            return {
              ...oldData,
              pages: [
                {
                  ...firstPage,
                  messages: [msg, ...firstPage.messages],
                },
                ...oldData.pages.slice(1),
              ],
            }
          }
        )

        // Update conversation list (move to top + update lastMessage)
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      }
    )

    return () => {
      unsubscribe()
    }
  }, [ablyChannelName, conversationId, queryClient])
}

// ── Ably Connection Lifecycle ─────────────────────────────────────────────────

/**
 * Hook that manages Ably connection lifecycle tied to auth state.
 * Place this once at the app level (e.g., in RootLayout or App).
 */
export function useAblyConnection() {
  const { isSignedIn } = useAuth()

  useEffect(() => {
    if (isSignedIn) {
      connectAbly()
    } else {
      disconnectAbly()
    }

    return () => {
      disconnectAbly()
    }
  }, [isSignedIn])
}

// ── Notification Channel Subscription ─────────────────────────────────────────

/**
 * Subscribes to the user's notification channel for real-time notification updates.
 * Invalidates notification queries when a new notification arrives.
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    connectAbly()

    const unsubscribe = subscribeToChannel(
      `user:${userId}:notifications`,
      "new-notification",
      () => {
        // Invalidate notifications + user profile (for unreadNotificationCount)
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      }
    )

    return () => {
      unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Returns a stable callback that adds a local message to cache immediately
 * (optimistic update) before the server round-trip completes.
 */
export function useOptimisticMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  return useCallback(
    (tempMessage: Message) => {
      if (!conversationId) return

      queryClient.setQueryData(
        ["messages", conversationId],
        (oldData: { pages: ConversationDetail[]; pageParams: unknown[] } | undefined) => {
          if (!oldData || !oldData.pages[0]) return oldData

          const firstPage = oldData.pages[0]
          return {
            ...oldData,
            pages: [
              {
                ...firstPage,
                messages: [tempMessage, ...firstPage.messages],
              },
              ...oldData.pages.slice(1),
            ],
          }
        }
      )
    },
    [conversationId, queryClient]
  )
}
