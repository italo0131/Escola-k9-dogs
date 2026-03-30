"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

type MotionRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export default function MotionReveal({ children, className, delay = 0, y = 18 }: MotionRevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
