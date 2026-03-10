import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Search, Eye, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ReportedItem {
  id: string
  sellerId: string
  title: string
  description: string | null
  listingType: "SELL" | "RENT" | "BOTH"
  sellPrice: number | null
  rentPricePerDay: number | null
  images: string[]
  condition: string
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED" | "ARCHIVED"
  createdAt: string
  viewCount: number
  seller: { id: string; fullName: string; email: string }
  college: { id: string; name: string }
  category: { id: number; name: string }
  _count?: { reports: number; favorites: number; transactions: number }
}

interface PaginatedResponse {
  items: ReportedItem[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

const ITEM_STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  AVAILABLE: { label: "Available", variant: "default" },
  RESERVED: { label: "Reserved", variant: "secondary" },
  SOLD: { label: "Sold", variant: "outline" },
  RENTED: { label: "Rented", variant: "outline" },
  ARCHIVED: { label: "Archived", variant: "destructive" },
}

/**
 * ListingModeration — admin view of flagged/reported listings.
 * Route: /admin/listings
 */
export default function ListingModeration() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [previewItem, setPreviewItem] = useState<ReportedItem | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<ReportedItem | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["admin", "listings", page, debouncedSearch, statusFilter],
    queryFn: () =>
      api.get(
        `/admin/listings?page=${page}&limit=20&search=${debouncedSearch}&status=${statusFilter}`
      ),
  })

  const archiveMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.patch(`/items/${itemId}`, { status: "ARCHIVED" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listings"] })
      qc.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success("Listing archived successfully")
      setArchiveTarget(null)
    },
    onError: () => toast.error("Failed to archive listing"),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }

  const items = data?.items ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listing Moderation</h1>
        <p className="text-muted-foreground">Review and moderate item listings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
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
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {pagination
              ? `${pagination.total} listing${pagination.total !== 1 ? "s" : ""}`
              : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Posted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-3 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : items.map((item) => (
                      <tr key={item.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.images[0] && (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium line-clamp-1 max-w-[180px]">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.viewCount} views</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{item.seller.fullName}</p>
                          <p className="text-xs text-muted-foreground">{item.college.name}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.category.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant={ITEM_STATUS_BADGE[item.status].variant}>
                            {ITEM_STATUS_BADGE[item.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewItem(item)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/items/${item.id}`} target="_blank">
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                            {item.status !== "ARCHIVED" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setArchiveTarget(item)}
                              >
                                Archive
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && items.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No listings found</p>
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

      {/* Preview dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.title}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-3 text-sm">
              {previewItem.images[0] && (
                <img
                  src={previewItem.images[0]}
                  alt={previewItem.title}
                  className="w-full rounded-md object-cover"
                  style={{ maxHeight: 300 }}
                />
              )}
              <p className="text-muted-foreground">{previewItem.description}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>Condition: <strong>{previewItem.condition}</strong></span>
                <span>Type: <strong>{previewItem.listingType}</strong></span>
                {previewItem.sellPrice && <span>Price: <strong>₹{previewItem.sellPrice}</strong></span>}
              </div>
              <div className="text-xs text-muted-foreground">
                Seller: <strong>{previewItem.seller.fullName}</strong> ({previewItem.seller.email})
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveTarget?.title}" will be hidden from browse and search. The seller will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}
            >
              Archive Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
