// ============================================
// ItemDetail Page — full item view with gallery, pricing, seller info,
//                   Razorpay "Buy Now" / "Rent" flow (Phase 4)
// ============================================

import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ShoppingCart,
  CalendarClock,
  MapPin,
  Eye,
  Heart,
  Share2,
  Flag,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { VerificationBadge } from "@/components/ui/VerificationBadge"
import { ImageGallery } from "@/components/items/ImageGallery"
import { ItemGrid } from "@/components/items/ItemGrid"
import {
  ConfettiBurst,
  PaymentProcessingDialog,
  PaymentSuccessDialog,
  PaymentErrorDialog,
} from "@/components/payments/PaymentAnimations"
import { RentDatePicker } from "@/components/payments/RentDatePicker"
import { ReportModal } from "@/components/ReportModal"

import { useItem, useItems } from "@/hooks/useItems"
import { useToggleFavorite } from "@/hooks/useFavorites"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useCreateOrder, useVerifyPayment } from "@/hooks/useOrders"
import {
  openRazorpayCheckout,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay"
import {
  formatPrice,
  formatRelativeTime,
  conditionLabel,
  conditionColor,
  cn,
} from "@/lib/utils"
import { ROUTES } from "@/lib/constants"

/**
 * Full item detail page — image gallery, pricing panel, seller card, location.
 */
export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { data: item, isLoading, isError, error } = useItem(id)
  const { data: currentUser } = useUserProfile()
  const toggleFavorite = useToggleFavorite()
  const createOrder = useCreateOrder()
  const verifyPayment = useVerifyPayment()

  // Payment flow state
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [paymentErrorMsg, setPaymentErrorMsg] = useState("")
  const [lastPaidAmount, setLastPaidAmount] = useState("")
  const [lastConversationId, setLastConversationId] = useState<string | undefined>()
  const [_lastTransactionId, setLastTransactionId] = useState<string | undefined>()

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false)

  // Rent date picker state
  const [showRentPicker, setShowRentPicker] = useState(false)

  // Related items (same category, exclude current)
  const { data: relatedData } = useItems({
    category: item?.category?.slug,
    sort: "newest",
  })
  const relatedItems =
    relatedData?.pages
      .flatMap((p) => p.items)
      .filter((i) => i.id !== item?.id)
      .slice(0, 4) ?? []

  const handleFavoriteClick = () => {
    if (!isSignedIn) {
      toast.error("Sign in to save favorites")
      return
    }
    if (!item) return
    toggleFavorite.mutate({
      itemId: item.id,
      isFavorited: item.isFavorited ?? false,
    })
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: item?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    }
  }

  /** Common Razorpay flow: create order → open checkout → verify */
  const startPaymentFlow = (
    type: "BUY" | "RENT",
    rentStartDate?: string,
    rentEndDate?: string
  ) => {
    if (!isSignedIn) {
      toast.error("Sign in to make a purchase")
      return
    }
    if (!item) return

    // Check if buyer is trying to buy their own item
    if (currentUser?.id === item.sellerId) {
      toast.error("You cannot purchase your own listing")
      return
    }

    createOrder.mutate(
      {
        itemId: item.id,
        type,
        rentStartDate,
        rentEndDate,
      },
      {
        onSuccess: (orderData) => {
          openRazorpayCheckout({
            orderId: orderData.orderId,
            amount: orderData.amount,
            currency: orderData.currency,
            itemTitle: item.title,
            buyerName: currentUser?.fullName ?? "",
            buyerEmail: currentUser?.email ?? "",
            onSuccess: (response: RazorpaySuccessResponse) => {
              handlePaymentSuccess(response, orderData.transactionId)
            },
            onDismiss: () => {
              toast.info("Payment cancelled")
            },
          }).catch(() => {
            toast.error("Could not open payment window")
          })
        },
        onError: (err) => {
          toast.error((err as Error).message || "Failed to create order")
        },
      }
    )
  }

  const handlePaymentSuccess = (
    response: RazorpaySuccessResponse,
    transactionId: string
  ) => {
    setIsProcessing(true)
    verifyPayment.mutate(
      {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      },
      {
        onSuccess: (result) => {
          setIsProcessing(false)
          setLastPaidAmount(formatPrice(item?.sellPrice ?? item?.rentPricePerDay ?? "0"))
          setLastConversationId(result.conversationId)
          setLastTransactionId(transactionId)
          setShowConfetti(true)
          setShowSuccess(true)
        },
        onError: (err) => {
          setIsProcessing(false)
          setPaymentErrorMsg((err as Error).message || "Verification failed")
          setShowErrorDialog(true)
        },
      }
    )
  }

  const handleBuyNow = () => startPaymentFlow("BUY")

  const handleRentConfirm = (
    startDate: string,
    endDate: string,
    _totalAmount: number
  ) => {
    setShowRentPicker(false)
    startPaymentFlow("RENT", startDate, endDate)
  }

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </div>
    )
  }

  // ---- Error ----
  if (isError || !item) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive text-sm">
            {(error as Error)?.message ?? "Item not found"}
          </p>
          <Button variant="outline" onClick={() => navigate(ROUTES.BROWSE)}>
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  const hasSellPrice = item.sellPrice && (item.listingType === "SELL" || item.listingType === "BOTH")
  const hasRentPrice = item.rentPricePerDay && (item.listingType === "RENT" || item.listingType === "BOTH")
  const isAvailable = item.status === "AVAILABLE"

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Gallery */}
          <ImageGallery images={item.images} alt={item.title} />

          {/* Right: Item details */}
          <div className="flex flex-col gap-5">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(conditionColor(item.condition))}
              >
                {conditionLabel(item.condition)}
              </Badge>
              {item.listingType === "SELL" && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  For Sale
                </Badge>
              )}
              {item.listingType === "RENT" && (
                <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-800">
                  For Rent
                </Badge>
              )}
              {item.listingType === "BOTH" && (
                <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-800">
                  Sale & Rent
                </Badge>
              )}
              {!isAvailable && (
                <Badge variant="destructive">{item.status}</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-foreground leading-tight">
              {item.title}
            </h1>

            {/* Prices */}
            <div className="flex items-baseline gap-4">
              {hasSellPrice && (
                <div>
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(item.sellPrice!)}
                  </span>
                </div>
              )}
              {hasRentPrice && (
                <div>
                  <span className={cn("text-2xl font-bold", hasSellPrice ? "text-muted-foreground" : "text-primary")}>
                    {formatPrice(item.rentPricePerDay!)}
                  </span>
                  <span className="text-sm text-muted-foreground">/day</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {isAvailable && (
              <div className="flex gap-3">
                {hasSellPrice && (
                  <Button
                    className="btn-primary-gradient flex-1"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={createOrder.isPending || !isSignedIn || currentUser?.id === item.sellerId}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Buy Now
                  </Button>
                )}
                {hasRentPrice && (
                  <Button
                    variant={hasSellPrice ? "outline" : "default"}
                    className={!hasSellPrice ? "btn-primary-gradient flex-1" : "flex-1"}
                    size="lg"
                    onClick={() => {
                      if (!isSignedIn) {
                        toast.error("Sign in to rent this item")
                        return
                      }
                      if (currentUser?.id === item.sellerId) {
                        toast.error("You cannot rent your own listing")
                        return
                      }
                      setShowRentPicker(true)
                    }}
                    disabled={!isSignedIn || currentUser?.id === item.sellerId}
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Rent
                  </Button>
                )}
              </div>
            )}

            {/* Utility actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavoriteClick}
                className={cn(
                  "gap-1.5",
                  item.isFavorited && "text-red-400"
                )}
              >
                <Heart
                  className={cn("h-4 w-4", item.isFavorited && "fill-current")}
                />
                {item.favoriteCount}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Eye className="h-3.5 w-3.5" />
                {item.viewCount} views
              </div>
            </div>

            <Separator />

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Category" value={item.category.name} />
              <DetailItem label="Listed" value={formatRelativeTime(item.createdAt)} />
              <DetailItem label="Campus" value={item.college.name} />
              {item.pickupLocation && (
                <DetailItem
                  label="Pickup"
                  value={item.pickupLocation}
                  icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
                />
              )}
            </div>

            <Separator />

            {/* Seller card */}
            <Card className="bg-card/50">
              <CardContent className="flex items-center gap-4 py-4">
                <Link to={ROUTES.PROFILE(item.seller.id)} className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 overflow-hidden">
                    {item.seller.avatarUrl ? (
                      <img
                        src={item.seller.avatarUrl}
                        alt={item.seller.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-medium text-zinc-400">
                        {item.seller.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={ROUTES.PROFILE(item.seller.id)}
                    className="text-sm font-medium text-foreground hover:underline flex items-center gap-1.5"
                  >
                    {item.seller.fullName}
                    <VerificationBadge status={item.seller.verificationStatus} size="sm" />
                  </Link>
                  {item.seller.college?.name && (
                    <p className="text-xs text-muted-foreground">
                      {item.seller.college.name}
                    </p>
                  )}
                  {item.seller.avgRating !== undefined && item.seller.avgRating > 0 && (
                    <p className="text-xs text-yellow-400">
                      {"★".repeat(Math.round(item.seller.avgRating))}{" "}
                      <span className="text-muted-foreground">
                        ({item.seller.avgRating.toFixed(1)})
                      </span>
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.CHAT}>Message</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Report */}
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground hover:text-destructive gap-1.5"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="h-3.5 w-3.5" />
              Report this listing
            </Button>
          </div>
        </div>

        {/* Related items */}
        {relatedItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Similar Items
            </h2>
            <ItemGrid items={relatedItems} />
          </div>
        )}
      </motion.div>

      {/* ---- Payment overlays ---- */}
      <ConfettiBurst active={showConfetti} />

      <PaymentProcessingDialog open={isProcessing} />

      <PaymentSuccessDialog
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          setShowConfetti(false)
        }}
        amount={lastPaidAmount}
        itemTitle={item?.title ?? ""}
        onOpenChat={
          lastConversationId
            ? () => navigate(ROUTES.CHAT_THREAD(lastConversationId!))
            : undefined
        }
        onViewTransaction={() => navigate(ROUTES.DASHBOARD)}
      />

      <PaymentErrorDialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        message={paymentErrorMsg}
        onRetry={handleBuyNow}
      />

      {item && (
        <RentDatePicker
          open={showRentPicker}
          onOpenChange={setShowRentPicker}
          rentPricePerDay={item.rentPricePerDay ?? "0"}
          onConfirm={handleRentConfirm}
          isLoading={createOrder.isPending}
        />
      )}

      {/* Report modal */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedItemId={id}
        targetName={item?.title}
      />
    </div>
  )
}

/** Small detail row with label + value */
function DetailItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground flex items-center gap-1">
        {icon}
        {value}
      </p>
    </div>
  )
}
