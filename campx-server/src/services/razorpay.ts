import Razorpay from "razorpay"
import crypto from "crypto"

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
})

/**
 * Creates a Razorpay order.
 *
 * @param amountInPaise - Amount in smallest currency unit (INR paise)
 * @param receipt       - Unique receipt string (Transaction ID)
 */
export async function createRazorpayOrder(
  amountInPaise: number,
  receipt: string
): Promise<{ id: string; amount: number; currency: string }> {
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
  })

  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
  }
}

/**
 * Verifies the Razorpay payment signature using HMAC SHA256.
 * Returns `true` if the signature is valid.
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(body)
    .digest("hex")

  return expectedSignature === razorpaySignature
}

/**
 * Verifies the Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET ?? "")
    .update(rawBody)
    .digest("hex")

  return expectedSignature === signature
}
