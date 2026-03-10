// ============================================
// Page: Profile — public user profile (/profile/:id)
// Task: 6F.3
// ============================================

import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Calendar,
  Package,
  Star,
  MessageSquare,
  Flag,
  ShieldCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerificationBadge } from "@/components/ui/VerificationBadge"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import { StarRating } from "@/components/reviews/StarRating"
import { ReportModal } from "@/components/ReportModal"
import { usePublicProfile } from "@/hooks/usePublicProfile"
import { useUserReviews } from "@/hooks/useReviews"
import { useItems } from "@/hooks/useItems"
import { formatDate } from "@/lib/utils"

/** Public user profile page — avatar, stats, listings, reviews */
export function Profile() {
  const { id } = useParams<{ id: string }>()
  const [reportOpen, setReportOpen] = useState(false)

  const { data: profile, isLoading, isError } = usePublicProfile(id)

  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserReviews(id)

  const { data: itemsData, isLoading: itemsLoading } = useItems({
    sellerId: id,
    sort: "newest",
  })

  // Flatten paginated reviews
  const reviews = reviewsData?.pages.flatMap((p) => p.reviews) ?? []
  const avgRating = reviewsData?.pages[0]?.avgRating ?? 0
  const totalReviews = reviewsData?.pages[0]?.totalReviews ?? 0

  // Flatten paginated items
  const items = itemsData?.pages.flatMap((p) => p.items) ?? []

  if (isLoading) return <ProfileSkeleton />

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-lg text-zinc-400">User not found</p>
          <Link to="/" className="text-sm text-purple-400 hover:underline">
            Back to home
          </Link>
        </motion.div>
      </div>
    )
  }

  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ---- Profile Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Avatar className="h-24 w-24 border-2 border-zinc-700">
              <AvatarImage
                src={profile.avatarUrl || undefined}
                alt={profile.fullName}
              />
              <AvatarFallback className="bg-purple-500/20 text-purple-300 text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-zinc-100">
                {profile.fullName}
              </h1>
              <VerificationBadge
                status={profile.verificationStatus}
                size="md"
              />
            </div>

            {profile.college && (
              <p className="text-sm text-zinc-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                {profile.college.name}
              </p>
            )}

            <p className="text-xs text-zinc-500 flex items-center gap-1.5 justify-center sm:justify-start">
              <Calendar className="h-3.5 w-3.5" />
              Member since {formatDate(profile.createdAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportOpen(true)}
              className="border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 gap-1.5"
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-3 gap-4"
        >
          <StatCard
            icon={<Package className="h-4 w-4 text-purple-400" />}
            label="Listings"
            value={profile.itemCount}
          />
          <StatCard
            icon={<Star className="h-4 w-4 text-yellow-400" />}
            label="Avg Rating"
            value={
              avgRating > 0 ? (
                <span className="flex items-center gap-1">
                  {avgRating.toFixed(1)}
                  <StarRating value={Math.round(avgRating)} size={12} />
                </span>
              ) : (
                "No ratings"
              )
            }
          />
          <StatCard
            icon={<MessageSquare className="h-4 w-4 text-blue-400" />}
            label="Reviews"
            value={totalReviews}
          />
        </motion.div>
      </motion.div>

      {/* ---- Tabs: Listings & Reviews ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger
              value="listings"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Listings ({profile.itemCount})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Reviews ({totalReviews})
            </TabsTrigger>
          </TabsList>

          {/* Listings tab */}
          <TabsContent value="listings" className="mt-6">
            {itemsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ItemCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyListings />
            )}
          </TabsContent>

          {/* Reviews tab */}
          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <ReviewCard key={review.id} review={review} index={i} />
                ))}
                {hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="border-zinc-700 text-zinc-400"
                    >
                      {isFetchingNextPage ? "Loading..." : "Load more reviews"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyReviews />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Report modal */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedUserId={id}
        targetName={profile.fullName}
      />
    </div>
  )
}

// ---- Helpers ----

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {icon}
      <span className="text-lg font-semibold text-zinc-100">
        {typeof value === "number" ? value : value}
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

function EmptyListings() {
  return (
    <div className="py-12 text-center">
      <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-sm text-zinc-500">No active listings</p>
    </div>
  )
}

function EmptyReviews() {
  return (
    <div className="py-12 text-center">
      <MessageSquare className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-sm text-zinc-500">No reviews yet</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}
