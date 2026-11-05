"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"

const DISMISS_KEY = "ddni-dashboard-announcement-dismissed"

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true)
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    void createClient().from("announcements").select("body").eq("title", "__dashboard_announcement__").eq("published", true).maybeSingle().then(({ data }) => {
      const body = typeof data?.body === "string" ? data.body.trim() : ""
      if (!body) return
      setAnnouncement(body)
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === body)
    })
  }, [])

  if (dismissed || !announcement) return null

  function dismiss() {
    window.sessionStorage.setItem(DISMISS_KEY, announcement)
    setDismissed(true)
  }

  return (
    <div className="relative z-10 flex w-full min-w-0 items-center justify-center border-b border-white/10 bg-burgundy px-12 py-2.5 text-center text-white shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <p className="min-w-0 text-xs font-medium sm:text-sm">{announcement}</p>
        <Link
          href="/institute"
          className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-gradient-to-r from-[#c89b3c] to-[#f3d27a] px-3.5 py-1 text-xs font-semibold text-[#1a1200] transition-opacity duration-150 hover:opacity-90"
        >
          Explore the Institute
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1/2 end-2 grid size-9 -translate-y-1/2 shrink-0 place-items-center rounded-full text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <X className="size-4" aria-hidden />
        <span className="sr-only">Dismiss announcement</span>
      </button>
    </div>
  )
}
