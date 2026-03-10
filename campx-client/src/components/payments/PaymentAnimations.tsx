// ============================================
// PaymentAnimations — confetti, processing, success, error feedback
// ============================================

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// ────────────────────────────────────────────
// Confetti burst (lightweight CSS particles)
// ────────────────────────────────────────────

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  size: number
}

const CONFETTI_COLORS = [
  "#A855F7", "#C084FC", "#7C3AED", "#22C55E",
  "#F59E0B", "#3B82F6", "#EC4899", "#FAFAFA",
]

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 6,
  }))
}

export function ConfettiBurst({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (active) {
      setPieces(generateConfetti(50))
      const timer = setTimeout(() => setPieces([]), 3500)
      return () => clearTimeout(timer)
    }
    setPieces([])
  }, [active])

  if (pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: "-10%",
            opacity: 1,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: Math.random() > 0.5 ? 720 : -720,
            scale: [1, 1.2, 0.8],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
          style={{
            position: "absolute",
            width: piece.size,
            height: piece.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  )
}

// ────────────────────────────────────────────
// Payment Processing Dialog
// ────────────────────────────────────────────

interface PaymentProcessingDialogProps {
  open: boolean
}

export function PaymentProcessingDialog({ open }: PaymentProcessingDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm text-center" hideCloseButton>
        <DialogHeader className="items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <DialogTitle>Verifying Payment...</DialogTitle>
          <DialogDescription>
            Please wait while we confirm your payment with Razorpay.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────
// Payment Success Dialog
// ────────────────────────────────────────────

interface PaymentSuccessDialogProps {
  open: boolean
  onClose: () => void
  amount: string
  itemTitle: string
  onViewTransaction?: () => void
  onOpenChat?: () => void
}

export function PaymentSuccessDialog({
  open,
  onClose,
  amount,
  itemTitle,
  onViewTransaction,
  onOpenChat,
}: PaymentSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="items-center">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/40"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Check className="h-8 w-8 text-green-400" strokeWidth={3} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
          <DialogDescription className="space-y-1">
            <p>You paid <span className="font-semibold text-foreground">{amount}</span></p>
            <p className="text-xs">for &quot;{itemTitle}&quot;</p>
            <p className="text-xs mt-2">
              Funds are held in escrow until you confirm receipt of the item.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          {onOpenChat && (
            <Button className="btn-primary-gradient" onClick={onOpenChat}>
              Chat with Seller
            </Button>
          )}
          {onViewTransaction && (
            <Button variant="outline" onClick={onViewTransaction}>
              View Transaction
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Continue Browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────
// Payment Error Dialog
// ────────────────────────────────────────────

interface PaymentErrorDialogProps {
  open: boolean
  onClose: () => void
  onRetry?: () => void
  message?: string
}

export function PaymentErrorDialog({
  open,
  onClose,
  onRetry,
  message = "Payment could not be processed. Please try again.",
}: PaymentErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={open ? { scale: [0, 1.2, 1], rotate: [0, -10, 10, 0] } : { scale: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/40"
          >
            <X className="h-8 w-8 text-red-400" strokeWidth={3} />
          </motion.div>
          <DialogTitle className="text-xl">Payment Failed</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          {onRetry && (
            <Button className="btn-primary-gradient" onClick={onRetry}>
              Try Again
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Go Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────
// Animated number counter (for wallet balance)
// ────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
}

export function AnimatedNumber({
  value,
  duration = 1,
  className,
  prefix = "₹",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = display
    const diff = value - start
    if (diff === 0) return

    const steps = Math.max(30, Math.round(duration * 60))
    let step = 0

    const interval = setInterval(() => {
      step++
      const progress = step / steps
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (step >= steps) {
        setDisplay(value)
        clearInterval(interval)
      }
    }, (duration * 1000) / steps)

    return () => clearInterval(interval)
    // We intentionally only animate when value changes, not display
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(display)

  return (
    <span className={className}>
      {prefix}{formatted}
    </span>
  )
}
