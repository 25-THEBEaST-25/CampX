// ============================================
// Verification Page — ID upload + status display (2F.2)
// ============================================

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck,
  Clock,
  ShieldX,
  ShieldAlert,
  Upload,
  ArrowLeft,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageUploader, type UploadedImage } from "@/components/items/ImageUploader"
import { useVerificationStatus, useSubmitVerification, useUserProfile } from "@/hooks"
import { ROUTES } from "@/lib/constants"

/**
 * Verification page with four possible states:
 * - UNVERIFIED: shows upload UI for college ID
 * - PENDING: shows "Under Review" animation
 * - VERIFIED: shows success state
 * - REJECTED: shows reason + re-submit option
 */
export function Verification() {
  const navigate = useNavigate()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: verification, isLoading: verificationLoading } =
    useVerificationStatus()
  const { mutateAsync: submitVerification, isPending: isSubmitting } =
    useSubmitVerification()

  const [idImage, setIdImage] = useState<UploadedImage[]>([])

  const status = profile?.verificationStatus ?? "UNVERIFIED"
  const isLoading = profileLoading || verificationLoading

  /** Submit the uploaded ID card for verification */
  const handleSubmit = useCallback(async () => {
    if (idImage.length === 0) {
      toast.error("Please upload your college ID card")
      return
    }
    try {
      await submitVerification({ idCardImageUrl: idImage[0]!.url })
      toast.success("Verification submitted! We'll review it shortly.")
    } catch {
      toast.error("Failed to submit. Please try again.")
    }
  }, [idImage, submitVerification])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <AnimatePresence mode="wait">
        {/* ---- VERIFIED ---- */}
        {status === "VERIFIED" && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-green-900/50 bg-green-950/30">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20"
                >
                  <ShieldCheck className="h-10 w-10 text-green-400" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-white">
                  You&apos;re Verified!
                </h2>
                <p className="mt-2 max-w-xs text-sm text-zinc-400">
                  Your college ID has been verified. You now have full access to
                  all marketplace features including selling.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => navigate(ROUTES.SELL)}
                >
                  Start Selling
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ---- PENDING ---- */}
        {status === "PENDING" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-yellow-900/50 bg-yellow-950/20">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 8,
                    ease: "linear",
                  }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20"
                >
                  <Clock className="h-10 w-10 text-yellow-400" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-white">
                  Under Review
                </h2>
                <p className="mt-2 max-w-xs text-sm text-zinc-400">
                  We&apos;ve received your college ID and it&apos;s being
                  reviewed. This usually takes a few hours during business
                  hours.
                </p>
                {verification?.createdAt && (
                  <p className="mt-3 text-xs text-zinc-500">
                    Submitted{" "}
                    {new Date(verification.createdAt).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => navigate(ROUTES.BROWSE)}
                >
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ---- REJECTED ---- */}
        {status === "REJECTED" && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-red-900/50 bg-red-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                    <ShieldX className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">
                      Verification Rejected
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Your submission didn&apos;t pass our review
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {verification?.reviewerNotes && (
                  <div className="rounded-lg border border-red-900/30 bg-red-950/30 p-4">
                    <p className="text-sm font-medium text-red-300">
                      Reason:
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {verification.reviewerNotes}
                    </p>
                  </div>
                )}

                <p className="text-sm text-zinc-400">
                  Please upload a clear photo of your valid college ID card.
                  Make sure all text is legible and the photo isn&apos;t
                  blurry.
                </p>

                <ImageUploader
                  preset="ids"
                  maxFiles={1}
                  value={idImage}
                  onChange={setIdImage}
                  label="Upload a new ID card photo"
                />

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || idImage.length === 0}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Re-submit
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ---- UNVERIFIED (default) ---- */}
        {status === "UNVERIFIED" && (
          <motion.div
            key="unverified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <ShieldAlert className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-white">
                      Verify Your Identity
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Upload your college ID to unlock selling
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h3 className="text-sm font-medium text-zinc-300">
                    Why verify?
                  </h3>
                  <ul className="space-y-1.5 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Unlock the ability to list and sell items
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Get a verified badge on your profile
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Build trust with buyers on campus
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label>College ID Card</Label>
                  <ImageUploader
                    preset="ids"
                    maxFiles={1}
                    value={idImage}
                    onChange={setIdImage}
                    label="Drop your college ID here"
                  />
                  <p className="text-xs text-zinc-500">
                    Make sure your name, photo, and college name are clearly
                    visible. We&apos;ll never share this image.
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || idImage.length === 0}
                  className="btn-primary-gradient w-full"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
