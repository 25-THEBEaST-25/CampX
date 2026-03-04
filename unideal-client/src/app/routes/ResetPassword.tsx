// ============================================
// Reset Password Page — handles token from email link
// ============================================

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

import { api, ApiError } from "@/lib/api"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetForm = z.infer<typeof schema>

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  })

  // No token in URL
  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-white">Invalid Link</h1>
          <p className="text-sm text-zinc-400">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password">
            <Button className="bg-primary hover:bg-primary/90">
              Request a new link
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
          <p className="text-sm text-zinc-400">
            Your password has been changed. You can now sign in.
          </p>
          <Link to={ROUTES.SIGN_IN}>
            <Button className="bg-primary hover:bg-primary/90">
              Go to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: ResetForm) => {
    try {
      await api.post("/api/auth/reset-password", {
        token,
        newPassword: data.password,
      })
      setSuccess(true)
      toast.success("Password reset successfully!")
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-[#121212] p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="border-zinc-700 bg-zinc-900 pr-10 text-white placeholder:text-zinc-500 focus:border-primary"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:border-primary"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">
                {errors.confirmPassword.message}
              </p>
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
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  )
}
