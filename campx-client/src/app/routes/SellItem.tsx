// ============================================
// SellItem Page — verification gate + multi-step sell form
// ============================================

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Clock,
  Package,
  Loader2,
  Check,
} from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// Select components removed — category/condition use button grids
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

import { Skeleton } from "@/components/ui/skeleton"
import { ImageUploader } from "@/components/items/ImageUploader"
import { useUserProfile } from "@/hooks"
import { useCreateItem } from "@/hooks/useItems"
import {
  ROUTES,
  CATEGORIES,
  CONDITIONS,
  LISTING_TYPES,
  MAX_ITEM_IMAGES,
} from "@/lib/constants"
import { cn, formatPrice, conditionLabel } from "@/lib/utils"

// -------- Validation Schema --------

const sellFormSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    categoryId: z.number({ required_error: "Please select a category" }),
    condition: z.enum(["NEW", "LIKE_NEW", "USED", "HEAVILY_USED"], {
      required_error: "Please select condition",
    }),
    listingType: z.enum(["SELL", "RENT", "BOTH"], {
      required_error: "Please select listing type",
    }),
    sellPrice: z.number().positive("Price must be positive").optional(),
    rentPricePerDay: z.number().positive("Rent must be positive").optional(),
    images: z
      .array(z.object({ url: z.string().url(), publicId: z.string() }))
      .min(1, "Upload at least one image")
      .max(MAX_ITEM_IMAGES, `Maximum ${MAX_ITEM_IMAGES} images`),
    pickupLocation: z.string().max(200).optional(),
  })
  .refine(
    (data) => {
      if (data.listingType === "SELL" || data.listingType === "BOTH") {
        return data.sellPrice !== undefined && data.sellPrice > 0
      }
      return true
    },
    { message: "Sale price is required", path: ["sellPrice"] }
  )
  .refine(
    (data) => {
      if (data.listingType === "RENT" || data.listingType === "BOTH") {
        return data.rentPricePerDay !== undefined && data.rentPricePerDay > 0
      }
      return true
    },
    { message: "Rent price is required", path: ["rentPricePerDay"] }
  )

type SellFormValues = z.infer<typeof sellFormSchema>

const STEPS = [
  { id: 1, title: "Basics", description: "Title & description" },
  { id: 2, title: "Details", description: "Category & condition" },
  { id: 3, title: "Pricing", description: "Listing type & price" },
  { id: 4, title: "Images", description: "Upload photos" },
  { id: 5, title: "Review", description: "Confirm & submit" },
] as const

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

/**
 * SellItem page with a verification gate.
 * - If VERIFIED → shows multi-step sell form.
 * - If PENDING → shows "under review" message.
 * - If UNVERIFIED/REJECTED → shows a modal directing to /verification.
 */
export function SellItem() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useUserProfile()
  const createItem = useCreateItem()
  const [step, setStep] = useState(1)

  const status = profile?.verificationStatus ?? "UNVERIFIED"
  const needsVerification = status === "UNVERIFIED" || status === "REJECTED"
  const isPending = status === "PENDING"
  const isVerified = status === "VERIFIED"

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      condition: undefined,
      listingType: undefined,
      sellPrice: undefined,
      rentPricePerDay: undefined,
      images: [],
      pickupLocation: "",
    },
    mode: "onChange",
  })

  const {
    register,
    control,
    watch,
    trigger,
    handleSubmit,
    formState: { errors },
  } = form

  const watchedListingType = watch("listingType")
  const watchedImages = watch("images")
  const watchedValues = watch()

  /** Validate current step fields before advancing */
  const canAdvance = async (): Promise<boolean> => {
    const fieldsByStep: Record<number, (keyof SellFormValues)[]> = {
      1: ["title"],
      2: ["categoryId", "condition"],
      3: ["listingType", "sellPrice", "rentPricePerDay"],
      4: ["images"],
    }
    const fields = fieldsByStep[step]
    if (!fields) return true
    return trigger(fields)
  }

  const handleNext = async () => {
    if (await canAdvance()) {
      setStep((s) => Math.min(s + 1, STEPS.length))
    }
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1))
  }

  const onSubmit = async (values: SellFormValues) => {
    try {
      const item = await createItem.mutateAsync({
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        condition: values.condition,
        listingType: values.listingType,
        sellPrice: values.sellPrice,
        rentPricePerDay: values.rentPricePerDay,
        images: values.images.map((img) => img.url),
        pickupLocation: values.pickupLocation,
      })
      toast.success("Listing created!")
      navigate(ROUTES.ITEM_DETAIL(item.id))
    } catch {
      toast.error("Failed to create listing. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        List an Item
      </h1>

      {/* ---- Verified: Multi-step sell form ---- */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Progress steps */}
          <div className="mb-8 flex items-center justify-between">
            {STEPS.map(({ id, title }) => (
              <div key={id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border transition-colors",
                    step > id && "bg-primary text-primary-foreground border-primary",
                    step === id && "border-primary text-primary bg-primary/10",
                    step < id && "border-zinc-700 text-zinc-500 bg-transparent"
                  )}
                >
                  {step > id ? <Check className="h-4 w-4" /> : id}
                </div>
                <span className={cn(
                  "text-xs hidden sm:inline",
                  step >= id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {title}
                </span>
                {id < STEPS.length && (
                  <div
                    className={cn(
                      "hidden sm:block h-px w-8 mx-1",
                      step > id ? "bg-primary" : "bg-zinc-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form steps */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="py-8">
                <AnimatePresence mode="wait">
                  {/* Step 1: Basics */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-lg font-medium text-foreground mb-1">
                          What are you listing?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Give your item a clear title and description.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Engineering Mathematics Textbook"
                          {...register("title")}
                        />
                        {errors.title && (
                          <p className="text-xs text-destructive">{errors.title.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your item — condition details, what's included, etc."
                          rows={5}
                          {...register("description")}
                        />
                        {errors.description && (
                          <p className="text-xs text-destructive">{errors.description.message}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Category & Condition */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-lg font-medium text-foreground mb-1">
                          Category & Condition
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Help buyers find your item with the right category.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Controller
                          name="categoryId"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {CATEGORIES.map(({ id, name }) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => field.onChange(id)}
                                  className={cn(
                                    "rounded-lg border px-4 py-3 text-sm text-left transition-colors",
                                    field.value === id
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                  )}
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}
                        />
                        {errors.categoryId && (
                          <p className="text-xs text-destructive">{errors.categoryId.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Condition *</Label>
                        <Controller
                          name="condition"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-2 gap-2">
                              {CONDITIONS.map(({ value, label }) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    "rounded-lg border px-4 py-3 text-sm text-left transition-colors",
                                    field.value === value
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        />
                        {errors.condition && (
                          <p className="text-xs text-destructive">{errors.condition.message}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Listing Type & Pricing */}
                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-lg font-medium text-foreground mb-1">
                          Pricing
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Choose how you want to list and set your prices.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Listing Type *</Label>
                        <Controller
                          name="listingType"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-3 gap-2">
                              {LISTING_TYPES.map(({ value, label }) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    "rounded-lg border px-4 py-3 text-sm text-center transition-colors",
                                    field.value === value
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        />
                        {errors.listingType && (
                          <p className="text-xs text-destructive">{errors.listingType.message}</p>
                        )}
                      </div>
                      {(watchedListingType === "SELL" || watchedListingType === "BOTH") && (
                        <div className="space-y-2">
                          <Label htmlFor="sellPrice">Sale Price (₹) *</Label>
                          <Input
                            id="sellPrice"
                            type="number"
                            placeholder="e.g. 500"
                            {...register("sellPrice", { valueAsNumber: true })}
                          />
                          {errors.sellPrice && (
                            <p className="text-xs text-destructive">{errors.sellPrice.message}</p>
                          )}
                        </div>
                      )}
                      {(watchedListingType === "RENT" || watchedListingType === "BOTH") && (
                        <div className="space-y-2">
                          <Label htmlFor="rentPricePerDay">Rent Price / Day (₹) *</Label>
                          <Input
                            id="rentPricePerDay"
                            type="number"
                            placeholder="e.g. 50"
                            {...register("rentPricePerDay", { valueAsNumber: true })}
                          />
                          {errors.rentPricePerDay && (
                            <p className="text-xs text-destructive">{errors.rentPricePerDay.message}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4: Images */}
                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-lg font-medium text-foreground mb-1">
                          Photos
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Upload up to {MAX_ITEM_IMAGES} photos. The first image will be the cover.
                        </p>
                      </div>
                      <Controller
                        name="images"
                        control={control}
                        render={({ field }) => (
                          <ImageUploader
                            preset="items"
                            maxFiles={MAX_ITEM_IMAGES}
                            value={field.value}
                            onChange={field.onChange}
                            label="Drop item photos here"
                          />
                        )}
                      />
                      {errors.images && (
                        <p className="text-xs text-destructive">{errors.images.message}</p>
                      )}
                    </motion.div>
                  )}

                  {/* Step 5: Review */}
                  {step === 5 && (
                    <motion.div
                      key="step-5"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-lg font-medium text-foreground mb-1">
                          Review Your Listing
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Double-check everything before publishing.
                        </p>
                      </div>

                      {/* Image preview */}
                      {watchedImages && watchedImages.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {watchedImages.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt={`Preview ${i + 1}`}
                              className="h-20 w-20 rounded-lg object-cover shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
                        <ReviewRow label="Title" value={watchedValues.title || "—"} />
                        <ReviewRow
                          label="Category"
                          value={
                            CATEGORIES.find((c) => c.id === watchedValues.categoryId)?.name ?? "—"
                          }
                        />
                        <ReviewRow
                          label="Condition"
                          value={
                            watchedValues.condition
                              ? conditionLabel(watchedValues.condition)
                              : "—"
                          }
                        />
                        <ReviewRow
                          label="Listing Type"
                          value={
                            LISTING_TYPES.find((t) => t.value === watchedValues.listingType)?.label ?? "—"
                          }
                        />
                        {watchedValues.sellPrice && (
                          <ReviewRow
                            label="Sale Price"
                            value={formatPrice(watchedValues.sellPrice)}
                          />
                        )}
                        {watchedValues.rentPricePerDay && (
                          <ReviewRow
                            label="Rent / Day"
                            value={formatPrice(watchedValues.rentPricePerDay)}
                          />
                        )}
                        {watchedValues.pickupLocation && (
                          <ReviewRow label="Pickup" value={watchedValues.pickupLocation} />
                        )}
                        {watchedValues.description && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Description</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {watchedValues.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  {step < STEPS.length ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="btn-primary-gradient"
                      disabled={createItem.isPending}
                    >
                      {createItem.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Publish Listing
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      )}

      {/* ---- Pending: Gentle blocker ---- */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-yellow-900/50 bg-yellow-950/20">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <h2 className="text-xl font-medium text-white">
                Verification In Progress
              </h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-400">
                Your ID is being reviewed. Once approved, you&apos;ll be able
                to list items for sale or rent.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => navigate(ROUTES.VERIFICATION)}
              >
                Check Status
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ---- Unverified / Rejected: Gate modal ---- */}
      {needsVerification && (
        <Dialog open onOpenChange={() => navigate(-1)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <ShieldAlert className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl text-white">
                Verification Required
              </DialogTitle>
              <DialogDescription className="text-center">
                To protect our campus community, you need to verify your
                identity before listing items.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Quick & easy
                  </p>
                  <p className="text-xs text-zinc-400">
                    Just upload a photo of your college ID — takes less than a
                    minute.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Builds trust
                  </p>
                  <p className="text-xs text-zinc-400">
                    Verified sellers get a badge and more visibility on
                    listings.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="btn-primary-gradient w-full"
                onClick={() => navigate(ROUTES.VERIFICATION)}
              >
                Verify Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-zinc-400"
                onClick={() => navigate(-1)}
              >
                Maybe Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/** Small label + value row for the review step */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
