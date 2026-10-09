"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function SiteLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 450)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-[#071520] text-white" role="status" aria-live="polite" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-[#d8b865]" />
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b865]">Loading</span>
      </div>
    </div>
  )
}
