import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Search, Ban, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminUser {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
  isAdmin: boolean
  isBanned: boolean
  onboardingComplete: boolean
  createdAt: string
  college: { id: string; name: string } | null
  _count: {
    items: number
    buyerTransactions: number
    sellerTransactions: number
  }
}

interface PaginatedResponse {
  users: AdminUser[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

type PendingAction = {
  user: AdminUser
  action: "ban" | "unban" | "force_verify"
}

const VERIFICATION_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  UNVERIFIED: { label: "Unverified", variant: "secondary" },
  PENDING: { label: "Pending", variant: "outline" },
  VERIFIED: { label: "Verified", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
}

const ACTION_LABELS: Record<PendingAction["action"], { title: string; description: (u: AdminUser) => string; confirmLabel: string; variant: "default" | "destructive" }> = {
  ban: {
    title: "Ban User",
    description: (u) => `This will prevent ${u.fullName} from signing into CampX. All their active listings will be hidden.`,
    confirmLabel: "Ban User",
    variant: "destructive",
  },
  unban: {
    title: "Unban User",
    description: (u) => `This will restore ${u.fullName}'s access to CampX.`,
    confirmLabel: "Unban User",
    variant: "default",
  },
  force_verify: {
    title: "Force Verify",
    description: (u) => `This will manually mark ${u.fullName} as ID-verified, bypassing the normal review process.`,
    confirmLabel: "Force Verify",
    variant: "default",
  },
}

/**
 * UserManagement — admin user list with ban/unban and force-verify actions.
 * Route: /admin/users
 */
export default function UserManagement() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [pending, setPending] = useState<PendingAction | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["admin", "users", page, debouncedSearch],
    queryFn: () =>
      api.get(`/admin/users?page=${page}&limit=20&search=${debouncedSearch}`),
  })

  const actionMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      api.patch(`/admin/users/${userId}`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      qc.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success("User updated successfully")
      setPending(null)
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

  const users = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Search, view, and moderate platform users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {pagination ? `${pagination.total} user${pagination.total !== 1 ? "s" : ""}` : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                        </td>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-3 w-20" />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <Skeleton className="ml-auto h-7 w-20" />
                        </td>
                      </tr>
                    ))
                  : users.map((user) => (
                      <tr key={user.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl ?? undefined} />
                              <AvatarFallback>{user.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.fullName}</p>
                                {user.isAdmin && (
                                  <Badge variant="outline" className="text-xs">Admin</Badge>
                                )}
                                {user.isBanned && (
                                  <Badge variant="destructive" className="text-xs">Banned</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.college?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={VERIFICATION_BADGE[user.verificationStatus].variant}>
                            {VERIFICATION_BADGE[user.verificationStatus].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {user._count.items} listings ·{" "}
                          {user._count.buyerTransactions + user._count.sellerTransactions} txns
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!user.isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.verificationStatus !== "VERIFIED" && (
                                  <DropdownMenuItem
                                    onClick={() => setPending({ user, action: "force_verify" })}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Force Verify
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {user.isBanned ? (
                                  <DropdownMenuItem
                                    onClick={() => setPending({ user, action: "unban" })}
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" />
                                    Unban User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setPending({ user, action: "ban" })}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!isLoading && users.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No users found</p>
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

      {/* Confirmation dialog */}
      {pending && (
        <AlertDialog open onOpenChange={() => setPending(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{ACTION_LABELS[pending.action].title}</AlertDialogTitle>
              <AlertDialogDescription>
                {ACTION_LABELS[pending.action].description(pending.user)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={
                  pending.action === "ban"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
                onClick={() =>
                  actionMutation.mutate({
                    userId: pending.user.id,
                    action: pending.action,
                  })
                }
              >
                {ACTION_LABELS[pending.action].confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
