// ============================================
// RentDatePicker — date range selector for rental items
// ============================================

import { useState } from "react"
import { motion } from "framer-motion"
import { CalendarClock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatPrice } from "@/lib/utils"

interface RentDatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rentPricePerDay: string
  onConfirm: (startDate: string, endDate: string, totalAmount: number) => void
  isLoading?: boolean
}

/**
 * Dialog that lets the buyer select a rental period and see the calculated total.
 */
export function RentDatePicker({
  open,
  onOpenChange,
  rentPricePerDay,
  onConfirm,
  isLoading,
}: RentDatePickerProps) {
  const today = new Date().toISOString().split("T")[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState("")

  const pricePerDay = parseFloat(rentPricePerDay)
  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null
  const days =
    start && end && end > start
      ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  const totalAmount = days * pricePerDay

  const handleConfirm = () => {
    if (days > 0 && startDate && endDate) {
      onConfirm(startDate, endDate, totalAmount)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Select Rental Period
          </DialogTitle>
          <DialogDescription>
            Choose your start and end dates. You&apos;ll be charged{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(pricePerDay)}/day
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rent-start" className="text-xs text-muted-foreground">
                Start Date
              </Label>
              <Input
                id="rent-start"
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value >= endDate) setEndDate("")
                }}
              />
            </div>
            <div>
              <Label htmlFor="rent-end" className="text-xs text-muted-foreground">
                End Date
              </Label>
              <Input
                id="rent-end"
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {days > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card/50 p-3 space-y-1"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatPrice(pricePerDay)} × {days} day{days !== 1 ? "s" : ""}
                </span>
                <span className="font-semibold text-foreground">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </motion.div>
          )}

          <Button
            className="btn-primary-gradient w-full"
            size="lg"
            disabled={days <= 0 || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? "Processing..." : `Pay ${days > 0 ? formatPrice(totalAmount) : "..."}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
