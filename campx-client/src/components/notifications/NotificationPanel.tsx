// ============================================
// NotificationPanel — dropdown list of notifications
// ============================================

import { Fragment, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  Package,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useNotifications,
  useMarkNotificationsRead,
  useDeleteNotification,
} from "@/hooks"
import { formatRelativeTime, cn } from "@/lib/utils"
import type { Notification } from "@/types"

interface NotificationPanelProps {
  onClose: () => void
}

/**
 * Dropdown panel showing recent notifications.
 * Supports mark-all-read, individual delete, and click-to-navigate.
 */
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const {
    data: pages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications({})
  const markRead = useMarkNotificationsRead()
  const deleteNotif = useDeleteNotification()

  const notifications = pages?.pages.flatMap((p) => p.notifications) ?? []
  const unreadCount = pages?.pages[0]?.unreadCount ?? 0

  const handleMarkAllRead = useCallback(() => {
    markRead.mutate({ all: true })
  }, [markRead])

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      deleteNotif.mutate(id)
    },
    [deleteNotif]
  )

  const handleClick = useCallback(
    (notif: Notification) => {
      // Mark as read if unread
      if (!notif.isRead) {
        markRead.mutate({ ids: [notif.id] })
      }
      // Navigate based on notification data
      const data = notif.data as Record<string, string> | null
      if (data?.conversationId) {
        navigate(`/chat/${data.conversationId}`)
      } else if (data?.transactionId) {
        navigate(`/dashboard`)
      } else if (data?.itemId) {
        navigate(`/items/${data.itemId}`)
      }
      onClose()
    },
    [markRead, navigate, onClose]
  )

  return (
    <div className="w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={handleMarkAllRead}
            disabled={markRead.isPending}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[380px] overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-foreground font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-0.5">No notifications yet</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onClick={() => handleClick(notif)}
                onDelete={(e) => handleDelete(notif.id, e)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Load more
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            navigate("/settings")
            onClose()
          }}
        >
          Notification settings
        </Button>
      </div>
    </div>
  )
}

// ── Single Notification Item ─────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 group",
        !notification.isRead && "bg-primary/5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center",
          !notification.isRead ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.button>
  )
}

// ── Icon mapping ─────────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "NEW_MESSAGE":
      return <MessageCircle className="h-4 w-4" />
    case "PAYMENT_RECEIVED":
    case "PAYMENT_RELEASED":
    case "PAYMENT_REFUNDED":
      return <CreditCard className="h-4 w-4" />
    case "VERIFICATION_APPROVED":
    case "VERIFICATION_REJECTED":
      return <ShieldCheck className="h-4 w-4" />
    case "ORDER_UPDATE":
    case "ITEM_SOLD":
      return <Package className="h-4 w-4" />
    case "REVIEW_RECEIVED":
      return <Star className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
