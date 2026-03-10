import { Outlet, NavLink, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Package,
  CreditCard,
  Flag,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

/** Navigation links rendered in the admin sidebar. */
const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/listings", label: "Listings", icon: Package },
  { to: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/colleges", label: "Colleges", icon: GraduationCap },
]

/**
 * AdminLayout — wraps all /admin/* routes.
 * Checks Clerk public metadata for the `isAdmin` flag.
 * Renders a sidebar-based shell for admin pages.
 */
export function AdminLayout() {
  const { user, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Gate: only users with isAdmin flag can access
  const isAdmin = user?.isAdmin === true
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const sidebar = (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card",
        "transition-transform duration-300 md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo + branding */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">CampX Admin</p>
          <p className="text-xs text-muted-foreground">Control Panel</p>
        </div>
        {/* Close button on mobile */}
        <button
          className="ml-auto text-muted-foreground md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <Separator />

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Admin identity footer */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl ?? undefined} />
          <AvatarFallback>{user?.fullName?.[0] ?? "A"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.fullName ?? "Admin"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          asChild
        >
          <a href="/" title="Back to site">
            <LogOut className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 md:relative md:z-auto",
          sidebarOpen ? "block" : "hidden md:block"
        )}
      >
        {sidebar}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">CampX Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
