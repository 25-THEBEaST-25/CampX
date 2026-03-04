import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"
import { useAblyConnection, useRealtimeNotifications } from "@/hooks"

/** Page transition variants */
const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
}

/** Root layout — Navbar + animated page content + Footer */
export function RootLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  // Manage Ably connection lifecycle (connect when auth'd, disconnect on logout)
  useAblyConnection()

  // Subscribe to real-time notifications for the current user
  useRealtimeNotifications(user?.id)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
