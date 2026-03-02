import { Resend } from "resend"
import { prisma } from "../lib/prisma.js"

const resend = new Resend(process.env.RESEND_API_KEY ?? "")

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Unideal <noreply@unideal.in>"

// ── Notification Preference Check ──────────────────────────────────────────

/** Default notification preferences shape */
interface NotificationPreferences {
  email: {
    messages: boolean
    transactions: boolean
    reviews: boolean
    promotions: boolean
  }
  push: {
    messages: boolean
    transactions: boolean
    reviews: boolean
    promotions: boolean
  }
}

const DEFAULT_PREFS: NotificationPreferences = {
  email: { messages: true, transactions: true, reviews: true, promotions: true },
  push: { messages: true, transactions: true, reviews: true, promotions: true },
}

/**
 * Check whether a user has a given email notification category enabled.
 * Falls back to true (enabled) if no preferences are stored.
 */
async function isEmailEnabled(
  userId: string,
  category: keyof NotificationPreferences["email"]
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  })
  const prefs = (user?.notificationPreferences as NotificationPreferences | null) ?? DEFAULT_PREFS
  return prefs.email?.[category] ?? true
}

/**
 * Sends a verification-approved email to the user.
 *
 * @param email     - Recipient email address
 * @param fullName  - Recipient's full name
 */
export async function sendVerificationApprovedEmail(
  email: string,
  fullName: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your College ID is Verified! 🎉",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A855F7;">Welcome aboard, ${fullName}!</h2>
        <p>Your college ID has been verified. You can now list items for sale on Unideal.</p>
        <p>Start selling by visiting your dashboard.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}

/**
 * Sends a verification-rejected email to the user.
 *
 * @param email         - Recipient email address
 * @param fullName      - Recipient's full name
 * @param reviewerNotes - Optional reason for rejection
 */
export async function sendVerificationRejectedEmail(
  email: string,
  fullName: string,
  reviewerNotes?: string | null
): Promise<void> {
  const reason = reviewerNotes ?? "No specific reason provided"
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verification Update — Action Needed",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Hi ${fullName},</h2>
        <p>Unfortunately, your college ID verification was not approved.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please upload a clearer photo of your college ID and try again.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}

/**
 * Sends a payment-secured email to the seller.
 *
 * @param email     - Seller email address
 * @param fullName  - Seller's full name
 * @param itemTitle - Title of the item purchased
 * @param amount    - Amount in INR (rupees, not paise)
 */
export async function sendPaymentSecuredEmail(
  email: string,
  fullName: string,
  itemTitle: string,
  amount: number
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Payment Secured — ₹${amount} for "${itemTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A855F7;">Payment Secured!</h2>
        <p>Hi ${fullName},</p>
        <p>A buyer has paid <strong>₹${amount}</strong> for your listing <strong>"${itemTitle}"</strong>.</p>
        <p>The funds are held in escrow until the buyer confirms receipt. Chat with them to arrange the handoff!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}

/**
 * Sends a funds-released email to the seller after buyer confirms receipt.
 *
 * @param email    - Seller email address
 * @param fullName - Seller's full name
 * @param amount   - Amount released in INR (rupees, not paise)
 */
export async function sendFundsReleasedEmail(
  email: string,
  fullName: string,
  amount: number
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `₹${amount} Released to Your Wallet!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #22C55E;">Funds Released!</h2>
        <p>Hi ${fullName},</p>
        <p><strong>₹${amount}</strong> has been released from escrow and added to your Unideal wallet.</p>
        <p>You can withdraw your balance anytime from the Wallet page.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}

// ── New Message Digest Email (5B.5) ────────────────────────────────────────

/**
 * Sends a new-message notification email. Respects user's email preferences.
 *
 * @param userId        - Recipient's user ID (for preference check)
 * @param email         - Recipient email address
 * @param fullName      - Recipient's full name
 * @param senderName    - Sender's display name
 * @param messagePreview - Short preview of the message text
 * @param itemTitle     - Title of the item the conversation is about
 */
export async function sendNewMessageEmail(
  userId: string,
  email: string,
  fullName: string,
  senderName: string,
  messagePreview: string,
  itemTitle: string
): Promise<void> {
  if (!(await isEmailEnabled(userId, "messages"))) return

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `New message from ${senderName} about "${itemTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A855F7;">You have a new message</h2>
        <p>Hi ${fullName},</p>
        <p><strong>${senderName}</strong> sent you a message about <strong>"${itemTitle}"</strong>:</p>
        <div style="background: #F3F4F6; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; color: #374151;">${messagePreview}</p>
        </div>
        <p>Open Unideal to reply.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}

// ── Transaction Update Email (5B.5) ────────────────────────────────────────

/**
 * Sends a transaction status update email. Respects user's email preferences.
 *
 * @param userId    - Recipient's user ID (for preference check)
 * @param email     - Recipient email address
 * @param fullName  - Recipient's full name
 * @param itemTitle - Title of the item
 * @param status    - New transaction status
 * @param role      - Whether the recipient is the buyer or seller
 */
export async function sendTransactionUpdateEmail(
  userId: string,
  email: string,
  fullName: string,
  itemTitle: string,
  status: string,
  role: "buyer" | "seller"
): Promise<void> {
  if (!(await isEmailEnabled(userId, "transactions"))) return

  const statusMessages: Record<string, string> = {
    PAYMENT_PENDING: "Waiting for the buyer's payment.",
    PAYMENT_COMPLETED: "Payment received and held in escrow.",
    MEETUP_PENDING: "Arrange a meetup to exchange the item.",
    ITEM_HANDED_OVER: "The seller marked this item as handed over. Buyer, please confirm receipt.",
    COMPLETED: "Transaction completed successfully! Funds have been released.",
    CANCELLED: "This transaction has been cancelled.",
    DISPUTED: "A dispute has been raised. Our team will review this shortly.",
  }

  const statusText = statusMessages[status] ?? `Status updated to: ${status}`
  const statusColor = status === "COMPLETED" ? "#22C55E" : status === "CANCELLED" || status === "DISPUTED" ? "#EF4444" : "#A855F7"

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Transaction Update — "${itemTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Transaction Update</h2>
        <p>Hi ${fullName},</p>
        <p>Your ${role === "buyer" ? "purchase" : "sale"} of <strong>"${itemTitle}"</strong> has an update:</p>
        <div style="background: #F3F4F6; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600;">${status.replace(/_/g, " ")}</p>
          <p style="margin: 8px 0 0; color: #374151;">${statusText}</p>
        </div>
        <p>Open Unideal for details.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}

// ── Review Received Email (5B.5) ──────────────────────────────────────────

/**
 * Sends a review-received email to the seller. Respects user's email preferences.
 *
 * @param userId       - Recipient's user ID (for preference check)
 * @param email        - Recipient email address
 * @param fullName     - Recipient's full name
 * @param reviewerName - Reviewer's display name
 * @param rating       - Star rating (1-5)
 * @param comment      - Review comment (optional)
 * @param itemTitle    - Title of the item reviewed
 */
export async function sendReviewReceivedEmail(
  userId: string,
  email: string,
  fullName: string,
  reviewerName: string,
  rating: number,
  comment: string | null,
  itemTitle: string
): Promise<void> {
  if (!(await isEmailEnabled(userId, "reviews"))) return

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating)

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `New Review — ${stars} for "${itemTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #A855F7;">You received a review!</h2>
        <p>Hi ${fullName},</p>
        <p><strong>${reviewerName}</strong> left a review for <strong>"${itemTitle}"</strong>:</p>
        <div style="background: #F3F4F6; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 20px; letter-spacing: 2px;">${stars}</p>
          ${comment ? `<p style="margin: 8px 0 0; color: #374151;">"${comment}"</p>` : ""}
        </div>
        <p>Visit your profile to see all your reviews.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Unideal — Your Campus Marketplace</p>
      </div>
    `,
  })
}
