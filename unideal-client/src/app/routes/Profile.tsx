import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

/** Public user profile page — Phase 6 will implement full profile */
export function Profile() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-36 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-56 mx-auto sm:mx-0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="font-semibold text-foreground mb-4">Listings</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Profile <code className="text-xs text-primary">{id}</code> — Full profile coming in Phase 6.
        </p>
      </motion.div>
    </div>
  )
}
