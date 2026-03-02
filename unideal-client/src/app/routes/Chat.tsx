import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

/** Chat page — Phase 5 will implement real-time messaging */
export function Chat() {
  return (
    <div className="mx-auto max-w-5xl h-[calc(100vh-10rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex h-full border border-border rounded-xl overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-primary" size={18} />
              <h2 className="font-semibold text-foreground">Messages</h2>
            </div>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
          <MessageCircle className="text-muted-foreground" size={40} />
          <h3 className="font-medium text-foreground">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">Real-time chat coming in Phase 5.</p>
        </div>
      </div>
    </div>
  )
}
