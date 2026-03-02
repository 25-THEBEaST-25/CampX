import * as React from "react"
import { cn } from "@/lib/utils"

/** Dark-themed text area */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-border bg-[#1E1E1E] px-3 py-2 text-sm text-foreground",
        "placeholder:text-zinc-500 resize-none",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-150",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"
