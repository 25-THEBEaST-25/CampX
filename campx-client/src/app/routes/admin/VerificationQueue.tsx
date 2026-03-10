import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Verification {
  id: string
  idCardImageUrl: string
  status: "PENDING" | "VERIFIED" | "REJECTED"
  reviewerNotes: string | null
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
    college: { id: string; name: string } | null
  }
}

interface PaginatedResponse {
  verifications: Verification[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  VERIFIED: { label: "Verified", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
}

/**
 * VerificationQueue — admin page for reviewing college ID submissions.
 * Route: /admin/verifications
 */
export default function VerificationQueue() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("PENDING")

  // Image lightbox state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<Verification | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")

  // Approve confirm state
  const [approveTarget, setApproveTarget] = useState<Verification | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["admin", "verifications", page, debouncedSearch, statusFilter],
    queryFn: () =>
      api.get(
        `/admin/verifications?page=${page}&limit=20&search=${debouncedSearch}&status=${statusFilter}`
      ),
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reviewerNotes,
    }: {
      id: string
      status: "VERIFIED" | "REJECTED"
      reviewerNotes?: string
    }) => api.patch(`/admin/verifications/${id}`, { status, reviewerNotes }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] })
      qc.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success(
        variables.status === "VERIFIED"
          ? "Verification approved successfully"
          : "Verification rejected"
      )
      setApproveTarget(null)
      setRejectTarget(null)
      setRejectNotes("")
    },
    onError: () => {
      toast.error("Action failed — please try again")
    },
  })

  /** Handle search input with debounce. */
  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }

  const verifications = data?.verifications ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification Queue</h1>
        <p className="text-muted-foreground">Review and approve college ID submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {pagination
              ? `${pagination.total} submission${pagination.total !== 1 ? "s" : ""}`
              : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-3 w-36" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Skeleton className="h-3 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="ml-auto h-7 w-48" /></td>
                      </tr>
                    ))
                  : verifications.map((v) => (
                      <tr key={v.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={v.user.avatarUrl ?? undefined} />
                              <AvatarFallback>{v.user.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{v.user.fullName}</p>
                              <p className="text-xs text-muted-foreground">{v.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {v.user.college?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_LABELS[v.status].variant}>
                            {STATUS_LABELS[v.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewUrl(v.idCardImageUrl)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View ID
                            </Button>
                            {v.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setApproveTarget(v)}
                                  disabled={reviewMutation.isPending}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setRejectTarget(v)}
                                  disabled={reviewMutation.isPending}
                                >
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!isLoading && verifications.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>No verifications found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>College ID Card</DialogTitle>
            <DialogDescription>Submitted for identity verification</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="College ID"
              className="w-full rounded-md object-contain"
              style={{ maxHeight: "60vh" }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approve confirmation */}
      <AlertDialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will verify <strong>{approveTarget?.user.fullName}</strong> and allow them to
              sell items on CampX.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                approveTarget &&
                reviewMutation.mutate({ id: approveTarget.id, status: "VERIFIED" })
              }
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog with notes */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectNotes("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <strong>{rejectTarget?.user.fullName}</strong>'s ID verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-notes">Rejection reason (optional)</Label>
            <Textarea
              id="reject-notes"
              placeholder="e.g. Image is blurry, ID appears expired, etc."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes("") }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reviewMutation.isPending}
              onClick={() =>
                rejectTarget &&
                reviewMutation.mutate({
                  id: rejectTarget.id,
                  status: "REJECTED",
                  reviewerNotes: rejectNotes || undefined,
                })
              }
            >
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Needed for the empty state icon
function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
