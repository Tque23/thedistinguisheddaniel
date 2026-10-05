"use client"

import { useState } from "react"
import { X } from "lucide-react"

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative z-10 flex w-full min-w-0 items-center justify-center bg-burgundy px-8 py-2 text-center text-white">
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <p className="min-w-0 text-xs font-medium sm:text-sm">
          The Spring Cohort applications close Friday. Secure your seat now.
        </p>
        <a
          href="#"
          className="shrink-0 rounded-full bg-gradient-to-r from-[#c89b3c] to-[#f3d27a] px-3 py-1 text-xs font-semibold text-[#1a1200] transition-opacity hover:opacity-90"
        >
          Apply now
        </a>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-1/2 right-2 -translate-y-1/2 shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-3.5" />
        <span className="sr-only">Dismiss announcement</span>
      </button>
    </div>
  )
}
