import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary/20 text-primary border-primary/30",
        secondary:
          "bg-secondary/20 text-secondary-foreground border-secondary/30",
        destructive:
          "bg-destructive/20 text-destructive border-destructive/30",
        outline: "border-border text-foreground",
        success:
          "bg-green-900/40 text-green-400 border-green-800",
        warning:
          "bg-yellow-900/40 text-yellow-400 border-yellow-800",
        info:
          "bg-blue-900/40 text-blue-400 border-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/** Coloured status badge */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
