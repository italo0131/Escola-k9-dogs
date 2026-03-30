import { ReactNode } from "react"
import { cn } from "@/app/lib/utils"

type CardProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-5", className)}>
      {title && <h3 className="mb-3 text-lg font-semibold">{title}</h3>}
      {children}
    </div>
  )
}
