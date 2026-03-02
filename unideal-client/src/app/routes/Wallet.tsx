// ============================================
// Wallet Page — balance, withdraw, transaction history (Phase 4)
// ============================================

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  Loader2,
  Filter,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { useWallet, useWalletHistory, useWithdraw } from "@/hooks/useWallet"
import { AnimatedNumber } from "@/components/payments/PaymentAnimations"
import {
  WALLET_TX_LABELS,
  WALLET_TX_ICONS,
} from "@/lib/constants"
import { formatPrice, formatRelativeTime, cn } from "@/lib/utils"

import type { WalletTransaction, WalletTransactionType } from "@/types"

// ── Icon map for wallet transaction types ──

const ICON_MAP: Record<string, React.ReactNode> = {
  ArrowDownLeft: <ArrowDownLeft className="h-4 w-4" />,
  ArrowUpRight: <ArrowUpRight className="h-4 w-4" />,
  ArrowDownRight: <ArrowDownRight className="h-4 w-4" />,
  ArrowUpLeft: <ArrowUpLeft className="h-4 w-4" />,
}

const ICON_COLOR_MAP: Record<string, string> = {
  CREDIT_ESCROW: "bg-green-900/40 text-green-400",
  RELEASE_ESCROW: "bg-blue-900/40 text-blue-400",
  WITHDRAWAL: "bg-orange-900/40 text-orange-400",
  REFUND_DEBIT: "bg-red-900/40 text-red-400",
}

/**
 * Wallet page — animated balance, withdrawal modal, paginated
 * transaction history with type filters.
 */
export function Wallet() {
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const [typeFilter, setTypeFilter] = useState<WalletTransactionType | "ALL">(
    "ALL"
  )

  const activeFilter =
    typeFilter === "ALL" ? undefined : (typeFilter as WalletTransactionType)
  const {
    data: historyPages,
    isLoading: historyLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWalletHistory(activeFilter)

  const withdraw = useWithdraw()

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")

  const balance = wallet ? parseFloat(wallet.balance) : 0
  const frozenBalance = wallet ? parseFloat(wallet.frozenBalance) : 0

  const allTxns = useMemo(
    () =>
      historyPages?.pages.flatMap((p) => p.transactions) ?? [],
    [historyPages]
  )

  // ── handlers ──

  const handleWithdraw = useCallback(() => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (amount > balance) {
      toast.error("Insufficient balance")
      return
    }
    withdraw.mutate(
      { amount },
      {
        onSuccess: () => {
          toast.success(`Withdrawal of ${formatPrice(String(amount))} initiated`)
          setShowWithdraw(false)
          setWithdrawAmount("")
        },
        onError: () => toast.error("Withdrawal failed. Try again."),
      }
    )
  }, [withdrawAmount, balance, withdraw])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <WalletIcon className="text-primary" size={24} />
        <h1 className="text-2xl font-semibold text-foreground">Wallet</h1>
      </div>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          <CardContent className="pt-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Available Balance
                </p>
                {walletLoading ? (
                  <Skeleton className="h-10 w-40" />
                ) : (
                  <AnimatedNumber
                    value={balance}
                    className="text-4xl font-bold text-foreground"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Frozen in escrow:{" "}
                  <span className="text-foreground">
                    {formatPrice(String(frozenBalance))}
                  </span>
                </p>
              </div>
              <Button
                variant="secondary"
                disabled={balance <= 0 || walletLoading}
                onClick={() => {
                  setWithdrawAmount("")
                  setShowWithdraw(true)
                }}
                className="flex items-center gap-2"
              >
                <ArrowDownRight size={16} />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction history */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Transaction History</CardTitle>
          <Tabs
            value={typeFilter}
            onValueChange={(v) =>
              setTypeFilter(v as WalletTransactionType | "ALL")
            }
          >
            <TabsList className="h-8">
              <TabsTrigger value="ALL" className="text-xs px-2">
                <Filter className="h-3 w-3 mr-1" />
                All
              </TabsTrigger>
              <TabsTrigger value="CREDIT_ESCROW" className="text-xs px-2">
                In
              </TabsTrigger>
              <TabsTrigger value="RELEASE_ESCROW" className="text-xs px-2">
                Released
              </TabsTrigger>
              <TabsTrigger value="WITHDRAWAL" className="text-xs px-2">
                Out
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : allTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {allTxns.map((txn, i) => (
                  <WalletTransactionRow key={txn.id} txn={txn} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Withdraw dialog ── */}
      <Dialog
        open={showWithdraw}
        onOpenChange={(v) => !v && setShowWithdraw(false)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Transfer your available balance to your linked bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-lg font-semibold text-foreground">
                {formatPrice(String(balance))}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (₹)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount"
                min={1}
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <Separator />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowWithdraw(false)}
              >
                Cancel
              </Button>
              <Button
                className="btn-primary-gradient"
                onClick={handleWithdraw}
                disabled={withdraw.isPending || !withdrawAmount}
              >
                {withdraw.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Withdraw
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ────────────────────────────────────────────
// Wallet Transaction Row
// ────────────────────────────────────────────

function WalletTransactionRow({
  txn,
  index,
}: {
  txn: WalletTransaction
  index: number
}) {
  const label = WALLET_TX_LABELS[txn.type] ?? txn.type
  const iconName = WALLET_TX_ICONS[txn.type] ?? "ArrowDownLeft"
  const icon = ICON_MAP[iconName] ?? <ArrowDownLeft className="h-4 w-4" />
  const colorClass = ICON_COLOR_MAP[txn.type] ?? "bg-muted text-muted-foreground"

  const isCredit = txn.type === "CREDIT_ESCROW" || txn.type === "RELEASE_ESCROW"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/30 transition-colors"
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          colorClass
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(txn.createdAt)}
          {txn.description && ` · ${txn.description}`}
        </p>
      </div>
      <p
        className={cn(
          "text-sm font-semibold",
          isCredit ? "text-green-400" : "text-red-400"
        )}
      >
        {isCredit ? "+" : "−"}
        {formatPrice(txn.amount)}
      </p>
    </motion.div>
  )
}
