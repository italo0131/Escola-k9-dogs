import { ButtonHTMLAttributes } from "react"
import { cn } from "@/app/lib/utils"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline"
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base = "rounded-lg px-4 py-2 text-sm font-semibold transition"
  const variants = {
    primary: "bg-cyan-500 text-white hover:-translate-y-0.5",
    ghost: "bg-transparent text-white hover:bg-white/10",
    outline: "border border-white/15 text-white hover:bg-white/10",
  }
  return <button className={cn(base, variants[variant], className)} {...props} />
}
