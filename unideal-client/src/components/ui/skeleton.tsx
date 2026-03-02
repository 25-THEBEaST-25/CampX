import * as React from "react"
import { cn } from "@/lib/utils"

/** Shimmer skeleton placeholder for loading states */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md skeleton-shimmer bg-muted",
        className
      )}
      {...props}
    />
  )
}
