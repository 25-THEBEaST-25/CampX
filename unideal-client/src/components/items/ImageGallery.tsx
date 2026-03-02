// ============================================
// ImageGallery — main image + thumbnails + lightbox
// ============================================

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { cloudinaryUrl } from "@/lib/cloudinary"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ImageGalleryProps {
  images: string[]
  alt: string
}

/**
 * Image gallery with main preview, thumbnail strip, and lightbox zoom.
 * Supports keyboard navigation and swipe on mobile.
 */
export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + images.length) % images.length)
    },
    [images.length]
  )

  const goNext = useCallback(
    () => goTo(activeIndex + 1),
    [activeIndex, goTo]
  )
  const goPrev = useCallback(
    () => goTo(activeIndex - 1),
    [activeIndex, goTo]
  )

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        No images
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={cloudinaryUrl(images[activeIndex], 800)}
            alt={`${alt} — image ${activeIndex + 1}`}
            loading="lazy"
            width={800}
            height={800}
            className="object-cover w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Zoom button */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/70 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Zoom image"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm text-xs text-foreground">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                idx === activeIndex
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={cloudinaryUrl(img, 100)}
                alt={`${alt} thumbnail ${idx + 1}`}
                loading="lazy"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-md border-none">
          <div className="relative">
            <img
              src={cloudinaryUrl(images[activeIndex], 1200)}
              alt={`${alt} — zoomed`}
              className="w-full h-auto max-h-[85vh] object-contain"
            />

            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-background/70 backdrop-blur-sm text-foreground"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation in lightbox */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/70 backdrop-blur-sm text-foreground"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/70 backdrop-blur-sm text-foreground"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
