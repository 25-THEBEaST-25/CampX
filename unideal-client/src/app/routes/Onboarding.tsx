// ============================================
// Onboarding Page — multi-step form (2F.1)
// ============================================

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@clerk/clerk-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  User,
  Phone,
  GraduationCap,
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageUploader, type UploadedImage } from "@/components/items/ImageUploader"
import { useOnboarding, useColleges } from "@/hooks"
import { ROUTES } from "@/lib/constants"

// -------- Zod schemas for each step --------

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
})

const collegeSchema = z.object({
  collegeId: z.string().min(1, "Please select your college"),
})

type ProfileValues = z.infer<typeof profileSchema>
type CollegeValues = z.infer<typeof collegeSchema>

const STEPS = [
  { title: "Your Profile", icon: User },
  { title: "Your College", icon: GraduationCap },
  { title: "Profile Photo", icon: Camera },
  { title: "All Set!", icon: Sparkles },
] as const

const TOTAL_STEPS = STEPS.length

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export function Onboarding() {
  const navigate = useNavigate()
  const { user: clerkUser } = useUser()
  const { mutateAsync: submitOnboarding, isPending: isSubmitting } =
    useOnboarding()
  const { data: colleges, isLoading: collegesLoading } = useColleges()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [avatar, setAvatar] = useState<UploadedImage[]>([])

  // Step 1 form
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: clerkUser?.fullName ?? "",
      phone: "",
    },
  })

  // Step 2 form
  const collegeForm = useForm<CollegeValues>({
    resolver: zodResolver(collegeSchema),
    defaultValues: { collegeId: "" },
  })

  /** Validate current step and advance */
  const goNext = useCallback(async () => {
    if (step === 0) {
      const valid = await profileForm.trigger()
      if (!valid) return
    } else if (step === 1) {
      const valid = await collegeForm.trigger()
      if (!valid) return
    }
    // Step 2 (avatar) has no required fields
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [step, profileForm, collegeForm])

  /** Go back to previous step */
  const goBack = useCallback(() => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  /** Submit the complete onboarding payload */
  const handleComplete = useCallback(async () => {
    const profile = profileForm.getValues()
    const college = collegeForm.getValues()

    try {
      await submitOnboarding({
        fullName: profile.fullName,
        phone: profile.phone,
        collegeId: college.collegeId,
        avatarUrl: avatar[0]?.url,
      })

      // Update Clerk public metadata so ProtectedRoute stops redirecting
      await clerkUser?.update({
        unsafeMetadata: { onboardingComplete: true },
      })

      toast.success("Welcome to Unideal! 🎉")
      navigate(ROUTES.BROWSE, { replace: true })
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }, [profileForm, collegeForm, avatar, submitOnboarding, clerkUser, navigate])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-10">
      {/* Progress bar */}
      <div className="mb-8 flex w-full items-center gap-2">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon
          return (
            <div key={s.title} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  i < step
                    ? "border-primary bg-primary text-white"
                    : i === step
                      ? "border-primary bg-transparent text-primary"
                      : "border-zinc-700 bg-transparent text-zinc-500"
                }`}
              >
                {i < step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs ${
                  i <= step ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#121212] p-6 sm:p-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* ---- Step 0: Profile ---- */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Tell us about yourself
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    This info appears on your profile and listings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        className="pl-10"
                        {...profileForm.register("fullName")}
                      />
                    </div>
                    {profileForm.formState.errors.fullName && (
                      <p className="text-sm text-red-400">
                        {profileForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <Input
                        id="phone"
                        placeholder="9876543210"
                        className="pl-10"
                        maxLength={10}
                        {...profileForm.register("phone")}
                      />
                    </div>
                    {profileForm.formState.errors.phone && (
                      <p className="text-sm text-red-400">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---- Step 1: College ---- */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Select your college
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    You&apos;ll see listings from students at your campus first.
                  </p>
                </div>

                {collegesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>College</Label>
                    <Select
                      value={collegeForm.watch("collegeId")}
                      onValueChange={(val) => collegeForm.setValue("collegeId", val, { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your college…" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-zinc-400" />
                              {c.name}
                              <span className="text-xs text-zinc-500">
                                — {c.city}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {collegeForm.formState.errors.collegeId && (
                      <p className="text-sm text-red-400">
                        {collegeForm.formState.errors.collegeId.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---- Step 2: Avatar ---- */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Add a profile photo
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Optional, but it helps build trust with buyers and sellers.
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="w-48">
                    <ImageUploader
                      preset="avatars"
                      maxFiles={1}
                      value={avatar}
                      onChange={setAvatar}
                      label="Upload photo"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---- Step 3: All Set ---- */}
            {step === 3 && (
              <div className="flex flex-col items-center py-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20"
                >
                  <Sparkles className="h-10 w-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-white">
                  You&apos;re all set!
                </h2>
                <p className="mt-2 max-w-xs text-sm text-zinc-400">
                  Hit the button below to complete setup and start exploring
                  your campus marketplace.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={isSubmitting}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="btn-primary-gradient"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Finishing…
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Skip text */}
      {step === 2 && (
        <button
          type="button"
          onClick={goNext}
          className="mt-4 text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-300"
        >
          Skip for now
        </button>
      )}
    </div>
  )
}
