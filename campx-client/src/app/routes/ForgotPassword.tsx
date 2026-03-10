// ============================================
// Forgot Password Page
// ============================================

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, Mail, ArrowLeft } from "lucide-react"

import { api, ApiError } from "@/lib/api"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
})

type ForgotForm = z.infer<typeof schema>

export function ForgotPassword() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: ForgotForm) => {
    try {
      await api.post("/api/auth/forgot-password", data)
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("Something went wrong.")
      }
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-sm text-zinc-400">
            If an account exists for{" "}
            <span className="font-medium text-white">{getValues("email")}</span>,
            we&apos;ve sent a password reset link.
          </p>
          <Link to={ROUTES.SIGN_IN}>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@college.ac.in"
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:border-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Send Reset Link
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          <Link
            to={ROUTES.SIGN_IN}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
