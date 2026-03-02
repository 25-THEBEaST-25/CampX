// ============================================
// Sign Up Page — Clerk embedded component
// ============================================

import { SignUp as ClerkSignUp } from "@clerk/clerk-react"
import { ROUTES } from "@/lib/constants"

export function SignUp() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <ClerkSignUp
        routing="path"
        path={ROUTES.SIGN_UP}
        signInUrl={ROUTES.SIGN_IN}
        afterSignUpUrl={ROUTES.ONBOARDING}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#121212] border border-zinc-800 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton:
              "bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800",
            socialButtonsBlockButtonText: "text-zinc-200",
            dividerLine: "bg-zinc-700",
            dividerText: "text-zinc-500",
            formFieldLabel: "text-zinc-300",
            formFieldInput:
              "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary",
            formButtonPrimary:
              "bg-primary hover:bg-primary/90 text-white",
            footerActionLink: "text-primary hover:text-primary/80",
            identityPreviewEditButton: "text-primary",
          },
        }}
      />
    </div>
  )
}
