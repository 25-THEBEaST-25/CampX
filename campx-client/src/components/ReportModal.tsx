// ============================================
// Component: ReportModal — report a user or item
// ============================================

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flag, CheckCircle2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REPORT_REASONS } from "@/lib/constants"
import { useSubmitReport } from "@/hooks/useReports"
import type { ReportReason } from "@/types"

interface ReportModalProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void
  /** ID of the user being reported (for user reports) */
  reportedUserId?: string
  /** ID of the item being reported (for item reports) */
  reportedItemId?: string
  /** Display name of the target being reported */
  targetName?: string
}

/**
 * Reusable modal for reporting users or items.
 * Includes reason dropdown, optional description, and success animation.
 */
export function ReportModal({
  open,
  onOpenChange,
  reportedUserId,
  reportedItemId,
  targetName,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("")
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const submitReport = useSubmitReport()

  const handleSubmit = () => {
    if (!reason) return

    submitReport.mutate(
      {
        reportedUserId: reportedUserId || undefined,
        reportedItemId: reportedItemId || undefined,
        reason: reason as ReportReason,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true)
        },
      }
    )
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state on close
      setTimeout(() => {
        setReason("")
        setDescription("")
        setSubmitted(false)
      }, 200)
    }
    onOpenChange(isOpen)
  }

  const isItem = !!reportedItemId
  const entityType = isItem ? "listing" : "user"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-[440px]">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-8"
            >
              <CheckCircle2 className="h-12 w-12 text-green-400" />
              <p className="text-lg font-medium text-zinc-200">
                Report Submitted
              </p>
              <p className="text-sm text-zinc-500 text-center">
                Thank you for helping keep our marketplace safe. Our team will
                review your report shortly.
              </p>
              <Button
                onClick={() => handleClose(false)}
                variant="outline"
                className="mt-2 border-zinc-700 text-zinc-300"
              >
                Close
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-zinc-100">
                  <Flag className="h-5 w-5 text-red-400" />
                  Report {entityType}
                </DialogTitle>
                <DialogDescription className="text-zinc-500">
                  {targetName
                    ? `Report "${targetName}" for violating our community guidelines.`
                    : `Report this ${entityType} for violating our community guidelines.`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Reason selector */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-400">
                    Reason <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={reason}
                    onValueChange={(val) => setReason(val as ReportReason)}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-300">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {REPORT_REASONS.map((r) => (
                        <SelectItem
                          key={r.value}
                          value={r.value}
                          className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-400">
                    Additional details (optional)
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context..."
                    className="min-h-[80px] resize-none bg-zinc-950 border-zinc-800 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-purple-500/50"
                    maxLength={1000}
                  />
                  <p className="text-xs text-zinc-600 text-right">
                    {description.length}/1000
                  </p>
                </div>

                {/* Warning notice */}
                <div className="flex items-start gap-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-500/80">
                    False reports may result in action against your account.
                    Please only report genuine violations.
                  </p>
                </div>

                {/* Error */}
                {submitReport.isError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-400"
                  >
                    Failed to submit report. Please try again.
                  </motion.p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => handleClose(false)}
                    className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!reason || submitReport.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {submitReport.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
