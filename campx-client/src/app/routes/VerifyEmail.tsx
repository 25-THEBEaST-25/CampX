// ============================================
// Verify Email Page — handles token from email link + waiting state
// ============================================

import { useEffect, useState } from "react"
import { useSearchParams, useLocation, Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react"

import { api, ApiError } from "@/lib/api"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"

type Status = "idle" | "verifying" | "success" | "error"

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const emailFromState = (location.state as { email?: string })?.email

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [resending, setResending] = useState(false)

  // If we have a token in the URL, verify it automatically
  useEffect(() => {
    if (!token) return

    const verify = async () => {
      setStatus("verifying")
      try {
        await api.get("/api/auth/verify-email", { params: { token } })
        setStatus("success")
        toast.success("Email verified! You can now sign in.")
        setTimeout(() => navigate(ROUTES.SIGN_IN, { replace: true }), 2000)
      } catch (err) {
        setStatus("error")
        if (err instanceof ApiError) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage("Verification failed. The link may have expired.")
        }
      }
    }
    verify()
  }, [token, navigate])

  const handleResend = async () => {
    if (!emailFromState) return
    setResending(true)
    try {
      await api.post("/api/auth/resend-verification", { email: emailFromState })
      toast.success("Verification email resent!")
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("Failed to resend. Please try again later.")
      }
    } finally {
      setResending(false)
    }
  }

  // Waiting state — user just registered and needs to check their email
  if (status === "idle") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-sm text-zinc-400">
            We sent a verification link to{" "}
            {emailFromState ? (
              <span className="font-medium text-white">{emailFromState}</span>
            ) : (
              "your email"
            )}
            . Click the link to activate your account.
          </p>
          {emailFromState && (
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resending}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend email
            </Button>
          )}
          <p className="text-xs text-zinc-500">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <Link to={ROUTES.SIGN_UP} className="text-primary hover:text-primary/80">
              try a different email
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Verifying
  if (status === "verifying") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="text-2xl font-bold text-white">Verifying your email...</h1>
          <p className="text-sm text-zinc-400">Please wait a moment.</p>
        </div>
      </div>
    )
  }

  // Success
  if (status === "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
          <p className="text-sm text-zinc-400">
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    )
  }

  // Error
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
        <p className="text-sm text-zinc-400">{errorMessage}</p>
        <div className="flex flex-col gap-3">
          <Link to={ROUTES.SIGN_UP}>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Try signing up again
            </Button>
          </Link>
          <Link to={ROUTES.SIGN_IN}>
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
