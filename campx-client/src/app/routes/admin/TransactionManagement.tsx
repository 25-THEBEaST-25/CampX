import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, RefreshCw, Unlock } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatPrice } from "@/lib/utils"

interface AdminTransaction {
  id: string
  type: "BUY" | "RENT"
  status:
    | "PENDING"
    | "CAPTURED"
    | "RESERVED"
    | "SETTLED"
    | "DISPUTED"
    | "REFUNDED"
    | "CANCELLED"
    | "EXPIRED"
  amount: number
  createdAt: string
  settledAt: string | null
  rentStartDate: string | null
  rentEndDate: string | null
  item: { id: string; title: string; images: string[] }
  buyer: { id: string; fullName: string; email: string; avatarUrl: string | null }
  seller: { id: string; fullName: string; email: string; avatarUrl: string | null }
}

type PendingIntervention = {
  transaction: AdminTransaction
  action: "refund" | "release"
}

interface PaginatedResponse {
  transactions: AdminTransaction[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

const STATUS_STYLES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  CAPTURED: { label: "Captured", variant: "secondary" },
  RESERVED: { label: "Reserved (Escrow)", variant: "default" },
  SETTLED: { label: "Settled", variant: "outline" },
  DISPUTED: { label: "Disputed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "outline" },
}

/**
 * TransactionManagement — admin view of all transactions with manual intervention (refund/release).
 * Route: /admin/transactions
 */
export default function TransactionManagement() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [intervention, setIntervention] = useState<PendingIntervention | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["admin", "transactions", page, statusFilter],
    queryFn: () =>
      api.get(`/admin/transactions?page=${page}&limit=20&status=${statusFilter}`),
  })

  const interventionMutation = useMutation({
    mutationFn: ({
      transactionId,
      action,
    }: {
      transactionId: string
      action: "refund" | "release"
    }) => api.patch(`/admin/transactions/${transactionId}`, { action }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "transactions"] })
      qc.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success(
        variables.action === "refund"
          ? "Refund processed — buyer's payment reversed"
          : "Funds released to seller wallet"
      )
      setIntervention(null)
    },
    onError: () => toast.error("Intervention failed — please try again"),
  })

  const transactions = data?.transactions ?? []
  const pagination = data?.pagination

  const canIntervene = (status: AdminTransaction["status"]) =>
    status === "RESERVED" || status === "DISPUTED"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Monitor all platform transactions. Intervene on stalled or disputed escrows.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESERVED">Reserved (Escrow)</SelectItem>
            <SelectItem value="DISPUTED">Disputed</SelectItem>
            <SelectItem value="SETTLED">Settled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {pagination
              ? `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""}`
              : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-3 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : transactions.map((txn) => (
                      <tr key={txn.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {txn.item.images[0] && (
                              <img
                                src={txn.item.images[0]}
                                alt={txn.item.title}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium line-clamp-1 max-w-[140px]">{txn.item.title}</p>
                              <p className="text-xs text-muted-foreground">{txn.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={txn.buyer.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs">{txn.buyer.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{txn.buyer.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={txn.seller.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs">{txn.seller.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{txn.seller.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatPrice(txn.amount)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_STYLES[txn.status].variant}>
                            {STATUS_STYLES[txn.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(txn.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          {canIntervene(txn.status) && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600"
                                onClick={() => setIntervention({ transaction: txn, action: "release" })}
                              >
                                <Unlock className="mr-1 h-3 w-3" />
                                Release
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => setIntervention({ transaction: txn, action: "refund" })}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Refund
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && transactions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Intervention confirmation */}
      {intervention && (
        <AlertDialog open onOpenChange={() => setIntervention(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {intervention.action === "refund"
                  ? "Process Refund?"
                  : "Release Funds to Seller?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {intervention.action === "refund" ? (
                  <>
                    This will reverse the escrow for "{intervention.transaction.item.title}".
                    <br />
                    Buyer <strong>{intervention.transaction.buyer.fullName}</strong> will be
                    notified of the refund of{" "}
                    <strong>{formatPrice(intervention.transaction.amount)}</strong>.
                  </>
                ) : (
                  <>
                    This will release{" "}
                    <strong>{formatPrice(intervention.transaction.amount)}</strong> from escrow
                    to seller <strong>{intervention.transaction.seller.fullName}</strong>'s wallet.
                    <br />
                    This is irreversible.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={
                  intervention.action === "refund"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
                onClick={() =>
                  interventionMutation.mutate({
                    transactionId: intervention.transaction.id,
                    action: intervention.action,
                  })
                }
                disabled={interventionMutation.isPending}
              >
                {intervention.action === "refund" ? "Process Refund" : "Release Funds"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
