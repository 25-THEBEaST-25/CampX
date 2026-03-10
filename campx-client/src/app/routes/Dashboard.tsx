// ============================================
// Dashboard — transaction history, active listings, stats (Phase 4)
// ============================================

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  ShoppingBag,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Loader2,
  PackageCheck,
  ChevronRight,
  Wallet,
  Star,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ReviewForm } from "@/components/reviews/ReviewForm"

import { useMyItems } from "@/hooks/useItems"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useTransactions, useConfirmReceipt, useDisputeTransaction } from "@/hooks/useTransactions"
import { useWallet } from "@/hooks/useWallet"
import { TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS, ROUTES } from "@/lib/constants"
import { formatPrice, formatRelativeTime, cn } from "@/lib/utils"

import type { Transaction, TransactionStatus } from "@/types"

// ── helpers ──

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  CAPTURED: <ArrowRightLeft className="h-3.5 w-3.5" />,
  RESERVED: <PackageCheck className="h-3.5 w-3.5" />,
  SETTLED: <CheckCircle2 className="h-3.5 w-3.5" />,
  DISPUTED: <AlertTriangle className="h-3.5 w-3.5" />,
}

/**
 * User dashboard — stats overview, transaction list with actions,
 * recent listings, and wallet balance.
 */
export function Dashboard() {
  const navigate = useNavigate()
  const { data: profile } = useUserProfile()
  const { data: walletData } = useWallet()
  const { data: myItems, isLoading: itemsLoading } = useMyItems()
  const { data: txData, isLoading: txLoading } = useTransactions()

  const confirmReceipt = useConfirmReceipt()
  const disputeTransaction = useDisputeTransaction()

  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">("ALL")
  const [disputeDialogTx, setDisputeDialogTx] = useState<Transaction | null>(null)
  const [disputeReason, setDisputeReason] = useState("")

  const transactions = txData?.transactions ?? []
  const filtered =
    statusFilter === "ALL"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter)

  const activeListings = (myItems ?? []).filter((i) => i.status === "AVAILABLE").length
  const soldItems = (myItems ?? []).filter((i) => i.status === "SOLD" || i.status === "RENTED").length

  // Transactions awaiting review (settled + not yet reviewed)
  const pendingReviews = transactions.filter(
    (tx) => tx.status === "SETTLED" && tx.hasReviewed === false
  )

  // ── stat cards ──

  const stats = [
    { icon: ShoppingBag, label: "Active Listings", value: String(activeListings) },
    { icon: ArrowRightLeft, label: "Transactions", value: String(transactions.length) },
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: walletData ? formatPrice(walletData.balance) : "—",
    },
    { icon: PackageCheck, label: "Items Sold", value: String(soldItems) },
  ]

  // ── handlers ──

  function handleConfirmReceipt(tx: Transaction) {
    confirmReceipt.mutate(tx.id, {
      onSuccess: () => toast.success("Receipt confirmed! Funds released to seller."),
      onError: () => toast.error("Failed to confirm receipt. Try again."),
    })
  }

  function handleDispute() {
    if (!disputeDialogTx || !disputeReason.trim()) return
    disputeTransaction.mutate(
      { transactionId: disputeDialogTx.id, reason: disputeReason.trim() },
      {
        onSuccess: () => {
          toast.success("Dispute raised. Our team will review it.")
          setDisputeDialogTx(null)
          setDisputeReason("")
        },
        onError: () => toast.error("Failed to raise dispute. Try again."),
      }
    )
  }

  /** Whether current user is the buyer of a transaction */
  function isBuyer(tx: Transaction): boolean {
    return tx.buyerId === profile?.id
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="text-primary" size={24} />
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <Icon className="text-primary" size={18} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending Reviews Banner (6F.5) */}
      {pendingReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <Card className="border-purple-800/40 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-purple-400" />
                Leave a Review ({pendingReviews.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Share your experience from recent transactions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReviews.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {tx.item.images?.[0] && (
                      <img
                        src={tx.item.images[0]}
                        alt={tx.item.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {tx.buyerId === profile?.id ? tx.seller.fullName : tx.buyer.fullName}
                      </p>
                    </div>
                  </div>
                  <ReviewForm
                    transactionId={tx.id}
                    itemTitle={tx.item.title}
                    compact
                  />
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{pendingReviews.length - 3} more transactions to review
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions section — spans 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Transactions</CardTitle>
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TransactionStatus | "ALL")}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="ALL" className="text-xs px-2">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="RESERVED" className="text-xs px-2">
                    Escrow
                  </TabsTrigger>
                  <TabsTrigger value="SETTLED" className="text-xs px-2">
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="DISPUTED" className="text-xs px-2">
                    Disputed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions found.
                </p>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((tx, i) => (
                      <TransactionCard
                        key={tx.id}
                        tx={tx}
                        index={i}
                        isBuyer={isBuyer(tx)}
                        onConfirmReceipt={() => handleConfirmReceipt(tx)}
                        onDispute={() => {
                          setDisputeDialogTx(tx)
                          setDisputeReason("")
                        }}
                        onChat={() =>
                          tx.conversationId
                            ? navigate(ROUTES.CHAT_THREAD(tx.conversationId))
                            : undefined
                        }
                        isConfirming={
                          confirmReceipt.isPending &&
                          confirmReceipt.variables === tx.id
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — recent listings + quick links */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Listings</CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : !myItems || myItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    No listings yet.
                  </p>
                  <Button size="sm" asChild>
                    <Link to={ROUTES.SELL}>Create Listing</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myItems.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      to={ROUTES.ITEM_DETAIL(item.id)}
                      className="flex items-center gap-3 rounded-lg border border-border p-2 hover:bg-muted/40 transition-colors"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.sellPrice ?? item.rentPricePerDay ?? "0")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          item.status === "AVAILABLE" && "border-green-800 text-green-400",
                          item.status === "SOLD" && "border-zinc-700 text-zinc-400",
                          item.status === "RENTED" && "border-blue-800 text-blue-400"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </Link>
                  ))}
                  {myItems.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full mt-1" asChild>
                      <Link to={ROUTES.BROWSE}>
                        View all ({myItems.length})
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to={ROUTES.WALLET}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to={ROUTES.SELL}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Sell an Item
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to={ROUTES.CHAT}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Dispute dialog ── */}
      <Dialog
        open={!!disputeDialogTx}
        onOpenChange={(v) => !v && setDisputeDialogTx(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              Describe the issue with this transaction. Our team will review it
              within 24 hours.
            </DialogDescription>
          </DialogHeader>
          {disputeDialogTx && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {disputeDialogTx.item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPrice(disputeDialogTx.amount)} •{" "}
                  {formatRelativeTime(disputeDialogTx.createdAt)}
                </p>
              </div>
              <Textarea
                placeholder="Describe the issue (e.g., item not as described, seller not responding)..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setDisputeDialogTx(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDispute}
                  disabled={
                    !disputeReason.trim() || disputeTransaction.isPending
                  }
                >
                  {disputeTransaction.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit Dispute
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ────────────────────────────────────────────
// Transaction Card
// ────────────────────────────────────────────

interface TransactionCardProps {
  tx: Transaction
  index: number
  isBuyer: boolean
  onConfirmReceipt: () => void
  onDispute: () => void
  onChat: () => void
  isConfirming: boolean
}

function TransactionCard({
  tx,
  index,
  isBuyer,
  onConfirmReceipt,
  onDispute,
  onChat,
  isConfirming,
}: TransactionCardProps) {
  const statusLabel = TRANSACTION_STATUS_LABELS[tx.status] ?? tx.status
  const statusColor = TRANSACTION_STATUS_COLORS[tx.status] ?? ""

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="rounded-lg border border-border bg-card/60 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Item thumbnail */}
        {tx.item.images?.[0] && (
          <Link to={ROUTES.ITEM_DETAIL(tx.item.id)}>
            <img
              src={tx.item.images[0]}
              alt={tx.item.title}
              className="h-14 w-14 rounded-md object-cover flex-shrink-0"
            />
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={ROUTES.ITEM_DETAIL(tx.item.id)}
                className="text-sm font-medium text-foreground hover:underline line-clamp-1"
              >
                {tx.item.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBuyer ? "Bought from" : "Sold to"}{" "}
                <span className="text-foreground">
                  {isBuyer ? tx.seller.fullName : tx.buyer.fullName}
                </span>
                {" · "}
                {formatRelativeTime(tx.createdAt)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {formatPrice(tx.amount)}
              </p>
              <Badge
                variant="outline"
                className={cn("text-[10px] gap-1 mt-1", statusColor)}
              >
                {STATUS_ICON[tx.status]}
                {statusLabel}
              </Badge>
            </div>
          </div>

          {/* Rent dates */}
          {tx.type === "RENT" && tx.rentStartDate && tx.rentEndDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Rental: {new Date(tx.rentStartDate).toLocaleDateString()} →{" "}
              {new Date(tx.rentEndDate).toLocaleDateString()}
            </p>
          )}

          {/* Actions */}
          {(tx.status === "RESERVED" || tx.conversationId) && (
            <div className="flex items-center gap-2 mt-3">
              {/* Confirm Receipt — buyer only, escrow status */}
              {isBuyer && tx.status === "RESERVED" && (
                <Button
                  size="sm"
                  className="btn-primary-gradient h-7 text-xs"
                  onClick={onConfirmReceipt}
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  Confirm Receipt
                </Button>
              )}

              {/* Dispute — buyer only, escrow status */}
              {isBuyer && tx.status === "RESERVED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={onDispute}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Dispute
                </Button>
              )}

              {/* Chat */}
              {tx.conversationId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={onChat}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
