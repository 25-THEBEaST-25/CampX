import { useQuery } from "@tanstack/react-query"
import {
  Users,
  ShieldCheck,
  Package,
  IndianRupee,
  TrendingUp,
  Flag,
  ArrowRight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/utils"

/** Shape returned by GET /api/admin/stats */
interface AdminStats {
  totalUsers: number
  pendingVerifications: number
  activeListings: number
  totalTransactions: number
  totalEscrow: number
  recentSignups: number
  openReports: number
}

interface StatCardProps {
  title: string
  value: string | number | undefined
  icon: React.ElementType
  loading?: boolean
  badge?: { label: string; variant: "default" | "destructive" | "secondary" | "outline" }
  href?: string
}

/** Individual stat card on the dashboard grid. */
function StatCard({ title, value, icon: Icon, loading, badge, href }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold">{value ?? "—"}</p>
            <div className="flex items-center gap-2">
              {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              {href && (
                <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                  <Link to={href}>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * AdminDashboard — overview of platform stats.
 * Route: /admin
 */
export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/admin/stats"),
    refetchInterval: 60_000, // Refresh every minute
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and quick actions</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          loading={isLoading}
          badge={{ label: `+${stats?.recentSignups ?? 0} this week`, variant: "secondary" }}
          href="/admin/users"
        />
        <StatCard
          title="Pending Verifications"
          value={stats?.pendingVerifications}
          icon={ShieldCheck}
          loading={isLoading}
          badge={
            stats?.pendingVerifications
              ? { label: "Needs attention", variant: "destructive" }
              : { label: "All clear", variant: "outline" }
          }
          href="/admin/verifications"
        />
        <StatCard
          title="Active Listings"
          value={stats?.activeListings}
          icon={Package}
          loading={isLoading}
          href="/admin/listings"
        />
        <StatCard
          title="Total Escrow (₹)"
          value={stats?.totalEscrow !== undefined ? formatPrice(stats.totalEscrow) : undefined}
          icon={IndianRupee}
          loading={isLoading}
          href="/admin/transactions"
        />
      </div>

      {/* Second row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Total Transactions"
          value={stats?.totalTransactions}
          icon={TrendingUp}
          loading={isLoading}
          href="/admin/transactions"
        />
        <StatCard
          title="Open Reports"
          value={stats?.openReports}
          icon={Flag}
          loading={isLoading}
          badge={
            stats?.openReports
              ? { label: "Pending review", variant: "destructive" }
              : { label: "All handled", variant: "outline" }
          }
          href="/admin/reports"
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold">Verification Queue</h3>
            <p className="text-sm text-muted-foreground">
              Review pending college ID submissions
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/admin/verifications">
                Open Queue <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold">User Management</h3>
            <p className="text-sm text-muted-foreground">
              Search, ban, or force-verify users
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/admin/users">
                Manage Users <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold">Reports Queue</h3>
            <p className="text-sm text-muted-foreground">
              Handle flagged listings and user reports
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/admin/reports">
                View Reports <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
