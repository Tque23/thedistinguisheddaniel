"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"

type AuthFeedbackDialogProps = {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}

export function AuthFeedbackDialog({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: AuthFeedbackDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#050f18]/90 p-6 text-white backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-[#dcb567]/30 bg-[#0c1e2c] p-8 text-center shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-feedback-title"
        aria-describedby="auth-feedback-description"
      >
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#dcb567]">
          <Icon className="size-4" aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 id="auth-feedback-title" className="mt-3 font-display text-2xl text-white">
          {title}
        </h2>
        <p id="auth-feedback-description" className="mt-3 text-sm leading-6 text-white/65">
          {description}
        </p>
        {children}
      </motion.div>
    </div>
  )
}
