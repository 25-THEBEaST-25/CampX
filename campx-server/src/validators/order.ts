import { z } from "zod"

export const createOrderSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["BUY", "RENT"]),
  rentStartDate: z.coerce.date().optional(),
  rentEndDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.type === "RENT") return !!data.rentStartDate && !!data.rentEndDate
    return true
  },
  { message: "rentStartDate and rentEndDate required for RENT orders", path: ["rentStartDate"] }
)

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
