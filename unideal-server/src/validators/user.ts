import { z } from "zod"

export const onboardingSchema = z.object({
  collegeId: z.string().min(1),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number").optional(),
})

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number").optional(),
  avatarUrl: z.string().url().optional(),
})

export const submitVerificationSchema = z.object({
  idCardImageUrl: z.string().url("Must be a valid Cloudinary URL"),
})

export const adminReviewVerificationSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  reviewerNotes: z.string().max(500).optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>
export type AdminReviewVerificationInput = z.infer<typeof adminReviewVerificationSchema>
