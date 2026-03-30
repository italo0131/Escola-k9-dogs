import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/app/lib/utils"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-gray-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
