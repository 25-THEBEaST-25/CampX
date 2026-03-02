import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Report {
  id: string
  reason: string
  description: string | null
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED"
  adminNotes: string | null
  createdAt: string
  reporter: { id: string; fullName: string; email: string; avatarUrl: string | null }
  reportedUser: { id: string; fullName: string; email: string; avatarUrl: string | null } | null
  reportedItem: { id: string; title: string; images: string[]; status: string } | null
}

interface PaginatedResponse {
  reports: Report[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

type PendingAction = {
  report: Report
  action: "action_taken" | "dismissed"
}

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  REVIEWED: { label: "Reviewed", variant: "outline" },
  ACTION_TAKEN: { label: "Action Taken", variant: "default" },
  DISMISSED: { label: "Dismissed", variant: "outline" },
}

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  FAKE_LISTING: "Fake Listing",
  INAPPROPRIATE: "Inappropriate",
  SCAM: "Scam",
  HARASSMENT: "Harassment",
  OTHER: "Other",
}

/**
 * ReportsQueue — admin view of user/item reports with action/dismiss options.
 * Route: /admin/reports
 */
export default function ReportsQueue() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["admin", "reports", page, debouncedSearch, statusFilter],
    queryFn: () =>
      api.get(`/admin/reports?page=${page}&limit=20&status=${statusFilter}`),
  })

  const actionMutation = useMutation({
    mutationFn: ({
      reportId,
      action,
      notes,
    }: {
      reportId: string
      action: "action_taken" | "dismissed"
      notes?: string
    }) =>
      api.patch(`/admin/reports/${reportId}`, { action, adminNotes: notes }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] })
      qc.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success(
        variables.action === "action_taken"
          ? "Action taken — report resolved"
          : "Report dismissed"
      )
      setPendingAction(null)
      setAdminNotes("")
    },
    onError: () => toast.error("Action failed — please try again"),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }

  const reports = data?.reports ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Queue</h1>
        <p className="text-muted-foreground">Handle user and listing reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="ACTION_TAKEN">Action Taken</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {pagination
              ? `${pagination.total} report${pagination.total !== 1 ? "s" : ""}`
              : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Filed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-3 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : reports.map((report) => (
                      <tr key={report.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={report.reporter.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs">{report.reporter.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{report.reporter.fullName}</p>
                              <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {report.reportedItem ? (
                            <div className="flex items-center gap-2">
                              {report.reportedItem.images[0] && (
                                <img
                                  src={report.reportedItem.images[0]}
                                  className="h-7 w-7 rounded object-cover"
                                  alt=""
                                />
                              )}
                              <div>
                                <p className="text-sm line-clamp-1 max-w-[140px]">
                                  {report.reportedItem.title}
                                </p>
                                <p className="text-xs text-muted-foreground">Listing</p>
                              </div>
                              <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                                <Link to={`/items/${report.reportedItem.id}`} target="_blank">
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          ) : report.reportedUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={report.reportedUser.avatarUrl ?? undefined} />
                                <AvatarFallback className="text-xs">{report.reportedUser.fullName[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm">{report.reportedUser.fullName}</p>
                                <p className="text-xs text-muted-foreground">User</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unknown</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {REASON_LABELS[report.reason] ?? report.reason}
                          </Badge>
                          {report.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-1 max-w-[160px]">
                              {report.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE[report.status].variant}>
                            {STATUS_BADGE[report.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          {report.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPendingAction({ report, action: "action_taken" })
                                  setAdminNotes("")
                                }}
                              >
                                Take Action
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={() => {
                                  setPendingAction({ report, action: "dismissed" })
                                  setAdminNotes("")
                                }}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && reports.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>
                {statusFilter === "PENDING"
                  ? "No pending reports — inbox is clear! 🎉"
                  : "No reports found"}
              </p>
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

      {/* Action dialog */}
      <Dialog
        open={!!pendingAction}
        onOpenChange={() => { setPendingAction(null); setAdminNotes("") }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === "action_taken" ? "Take Action on Report" : "Dismiss Report"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.action === "action_taken"
                ? "Mark this report as actioned. Add notes describing what action was taken (e.g. listing removed, user warned)."
                : "Mark this report as dismissed with no further action required."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin notes (optional)</Label>
            <Textarea
              id="admin-notes"
              placeholder={
                pendingAction?.action === "action_taken"
                  ? "e.g. Listing archived — violated content policy"
                  : "e.g. Report does not violate our guidelines"
              }
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setPendingAction(null); setAdminNotes("") }}
            >
              Cancel
            </Button>
            <Button
              variant={pendingAction?.action === "action_taken" ? "default" : "secondary"}
              disabled={actionMutation.isPending}
              onClick={() =>
                pendingAction &&
                actionMutation.mutate({
                  reportId: pendingAction.report.id,
                  action: pendingAction.action,
                  notes: adminNotes || undefined,
                })
              }
            >
              {pendingAction?.action === "action_taken" ? "Mark: Action Taken" : "Dismiss Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
