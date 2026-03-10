import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

/** 404 Not Found page */
export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6"
      >
        <p className="font-brand text-8xl font-bold bg-gradient-to-br from-purple-400 to-purple-700 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-muted-foreground max-w-xs">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to={ROUTES.HOME}>
          <Button>Back to Home</Button>
        </Link>
      </motion.div>
    </div>
  )
}
