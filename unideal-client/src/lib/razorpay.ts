// ============================================
// Razorpay Checkout — helper to open Razorpay modal
// ============================================

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID ?? ""

/** Load the Razorpay script dynamically (idempotent) */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.id = "razorpay-checkout-js"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface RazorpayCheckoutOptions {
  orderId: string
  amount: number
  currency: string
  itemTitle: string
  buyerName: string
  buyerEmail: string
  onSuccess: (response: RazorpaySuccessResponse) => void
  onDismiss?: () => void
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Opens the Razorpay Checkout modal.
 * Resolves the razorpay_* values on success, or null on dismiss.
 */
export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    throw new Error("Failed to load Razorpay SDK")
  }

  const Razorpay = (window as RazorpayWindow).Razorpay
  if (!Razorpay) {
    throw new Error("Razorpay SDK not available")
  }

  const rzp = new Razorpay({
    key: RAZORPAY_KEY_ID,
    amount: opts.amount, // in paise
    currency: opts.currency,
    name: "Unideal",
    description: opts.itemTitle,
    order_id: opts.orderId,
    prefill: {
      name: opts.buyerName,
      email: opts.buyerEmail,
    },
    theme: {
      color: "#A855F7", // --primary purple
    },
    handler: (response: RazorpaySuccessResponse) => {
      opts.onSuccess(response)
    },
    modal: {
      ondismiss: () => {
        opts.onDismiss?.()
      },
    },
  })

  rzp.open()
}

// -------- Window type augmentation --------

interface RazorpayInstance {
  open: () => void
  close: () => void
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance
}

interface RazorpayWindow extends Window {
  Razorpay?: RazorpayConstructor
}
