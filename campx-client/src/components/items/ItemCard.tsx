// ============================================
// ItemCard — listing card with image, price, condition, favorite
// ============================================

import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VerificationBadge } from "@/components/ui/VerificationBadge"
import { useToggleFavorite } from "@/hooks/useFavorites"
import { cloudinaryUrl } from "@/lib/cloudinary"
import { cn, formatPrice, conditionLabel, conditionColor } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import type { Item } from "@/types"

interface ItemCardProps {
  item: Item
  /** Show the heart favorite button (requires auth) */
  showFavorite?: boolean
}

/**
 * Responsive item card for browse grids and carousels.
 * Displays image, title, price, condition badge, college, and favorite toggle.
 */
export function ItemCard({ item, showFavorite = true }: ItemCardProps) {
  const toggleFavorite = useToggleFavorite()

  const priceDisplay =
    item.listingType === "RENT"
      ? `${formatPrice(item.rentPricePerDay ?? "0")}/day`
      : item.listingType === "BOTH"
        ? `${formatPrice(item.sellPrice ?? "0")} · ${formatPrice(item.rentPricePerDay ?? "0")}/day`
        : formatPrice(item.sellPrice ?? "0")

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite.mutate({
      itemId: item.id,
      isFavorited: !!item.isFavorited,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={ROUTES.ITEM_DETAIL(item.id)}>
        <Card className="overflow-hidden group cursor-pointer hover:shadow-glow-card transition-shadow duration-200">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {item.images[0] ? (
              <img
                src={cloudinaryUrl(item.images[0], 400)}
                srcSet={`${cloudinaryUrl(item.images[0], 400)} 400w, ${cloudinaryUrl(item.images[0], 800)} 800w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                alt={item.title}
                loading="lazy"
                width={400}
                height={400}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No image
              </div>
            )}

            {/* Favorite button */}
            {showFavorite && (
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={handleFavorite}
                className="absolute top-2 right-2 p-2 bg-background/70 backdrop-blur-sm rounded-full hover:bg-background/90 transition-colors z-10"
                aria-label={
                  item.isFavorited ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    item.isFavorited
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground"
                  )}
                />
              </motion.button>
            )}

            {/* Condition badge */}
            <Badge
              variant="outline"
              className={cn(
                "absolute bottom-2 left-2 text-[10px] font-medium",
                conditionColor(item.condition)
              )}
            >
              {conditionLabel(item.condition)}
            </Badge>

            {/* Listing type badge */}
            {item.listingType !== "SELL" && (
              <Badge
                variant="outline"
                className="absolute bottom-2 right-2 text-[10px] font-medium bg-primary/20 text-primary border-primary/30"
              >
                {item.listingType === "RENT" ? "Rent" : "Sale & Rent"}
              </Badge>
            )}
          </div>

          {/* Info */}
          <CardContent className="p-3">
            <h3 className="font-medium text-sm text-foreground line-clamp-1">
              {item.title}
            </h3>
            <p className="text-lg font-bold text-primary mt-1">
              {priceDisplay}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {item.seller?.verificationStatus && (
                <VerificationBadge
                  status={item.seller.verificationStatus}
                  size="sm"
                />
              )}
              <span className="text-xs text-muted-foreground truncate">
                {item.college?.name ?? "Campus"}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
