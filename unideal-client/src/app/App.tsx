import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/lib/api"
import { RootLayout } from "./layout/RootLayout"
import { ProtectedRoute } from "./layout/ProtectedRoute"
import { AdminLayout } from "./layout/AdminLayout"

// Lazy-loaded pages
import { lazy, Suspense } from "react"

const Home = lazy(() => import("./routes/Home").then((m) => ({ default: m.Home })))
const Browse = lazy(() => import("./routes/Browse").then((m) => ({ default: m.Browse })))
const ItemDetail = lazy(() => import("./routes/ItemDetail").then((m) => ({ default: m.ItemDetail })))
const SellItem = lazy(() => import("./routes/SellItem").then((m) => ({ default: m.SellItem })))
const Dashboard = lazy(() => import("./routes/Dashboard").then((m) => ({ default: m.Dashboard })))
const Chat = lazy(() => import("./routes/Chat").then((m) => ({ default: m.Chat })))
const Wallet = lazy(() => import("./routes/Wallet").then((m) => ({ default: m.Wallet })))
const Profile = lazy(() => import("./routes/Profile").then((m) => ({ default: m.Profile })))
const Settings = lazy(() => import("./routes/Settings").then((m) => ({ default: m.Settings })))
const Onboarding = lazy(() => import("./routes/Onboarding").then((m) => ({ default: m.Onboarding })))
const Verification = lazy(() => import("./routes/Verification").then((m) => ({ default: m.Verification })))
const Favorites = lazy(() => import("./routes/Favorites").then((m) => ({ default: m.Favorites })))
const SignIn = lazy(() => import("./routes/SignIn").then((m) => ({ default: m.SignIn })))
const SignUp = lazy(() => import("./routes/SignUp").then((m) => ({ default: m.SignUp })))
const NotFound = lazy(() => import("./routes/NotFound").then((m) => ({ default: m.NotFound })))

// Admin pages
const AdminDashboard = lazy(() => import("./routes/admin/AdminDashboard"))
const VerificationQueue = lazy(() => import("./routes/admin/VerificationQueue"))
const UserManagement = lazy(() => import("./routes/admin/UserManagement"))
const ListingModeration = lazy(() => import("./routes/admin/ListingModeration"))
const TransactionManagement = lazy(() => import("./routes/admin/TransactionManagement"))
const ReportsQueue = lazy(() => import("./routes/admin/ReportsQueue"))

/** Page-level fallback while lazy chunks load */
function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

/** Bootstraps the Clerk token getter into the API client */
function ApiTokenSetup() {
  const { getToken } = useAuth()
  useEffect(() => {
    api.setTokenGetter(() => getToken())
  }, [getToken])
  return null
}

/** React Router application definition */
export function App() {
  return (
    <BrowserRouter>
      <ApiTokenSetup />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public layout with Navbar + Footer */}
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/profile/:id" element={<Profile />} />

            {/* Protected routes — require Clerk auth */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/sell" element={<SellItem />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Clerk auth pages — outside main layout for clean appearance */}
          <Route path="/sign-in/*" element={<SignIn />} />
          <Route path="/sign-up/*" element={<SignUp />} />

          {/* Admin panel — separate layout with sidebar, protected by isAdmin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="verifications" element={<VerificationQueue />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="listings" element={<ListingModeration />} />
            <Route path="transactions" element={<TransactionManagement />} />
            <Route path="reports" element={<ReportsQueue />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
