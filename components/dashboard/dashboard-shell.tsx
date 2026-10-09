"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AnimatePresence, motion } from "motion/react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AnnouncementBar } from "@/components/dashboard/announcement-bar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { OverviewView } from "@/components/dashboard/views/overview-view"
import { InstituteView } from "@/components/dashboard/views/institute-view"
import { NetworkView } from "@/components/dashboard/views/network-view"
import { ProfileView } from "@/components/dashboard/views/profile-view"
import { SettingsView } from "@/components/dashboard/views/settings-view"
import { ProfileEditor } from "@/components/dashboard/profile-editor"
import type { Opportunity } from "@/lib/dashboard-data"

export type DashboardView = "overview" | "institute" | "network" | "profile" | "settings"

const SESSION_TIMEOUT_MS = 5 * 60 * 1000

export function DashboardShell() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<DashboardView>("overview")
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [accessState, setAccessState] = useState<"prepared" | "updates" | "active" | "blocked" | null>(null)
  const [member, setMember] = useState({ name: "Member", title: "DDNI Member", initials: "M", avatarColor: "#dcb567", isAdmin: false })
  const [adminOpportunities, setAdminOpportunities] = useState<Opportunity[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const signOut = useCallback(async () => {
    await createClient().auth.signOut()
    router.replace("/auth?timeout=1")
    router.refresh()
  }, [router])

  useEffect(() => {
    void createClient().auth.getUser().then(async ({ data }) => {
      const user = data.user
      if (!user) return setAccessState("prepared")
      const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Member")
      setMember({
        name,
        title: String(user.user_metadata?.title || user.user_metadata?.role || "DDNI Member"),
        initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        avatarColor: "#dcb567",
        isAdmin: user.app_metadata?.is_admin === true,
      })
      const { data: publishedItems } = await createClient().from("announcements").select("id, title, body, created_at").eq("published", true).order("created_at", { ascending: false }).limit(12)
      setAdminOpportunities((publishedItems || []).map((item) => ({
        id: item.id,
        title: item.title,
        postedBy: "DDNI Administration",
        postedByTitle: "Administration team",
        category: "Partnership",
        location: "DDNI Network",
        postedAt: new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round((new Date(item.created_at).getTime() - Date.now()) / 86400000), "day"),
        description: item.body,
      })))
      if (user.app_metadata?.is_admin === true) return setAccessState("active")
      setAccessState((user.user_metadata?.dashboard_status as "prepared" | "updates" | "active" | "blocked" | undefined) || "prepared")
    })
  }, [])

  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true)
        void signOut()
      }, SESSION_TIMEOUT_MS)
    }
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const
    events.forEach((event) => window.addEventListener(event, resetTimeout, { passive: true }))
    resetTimeout()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      events.forEach((event) => window.removeEventListener(event, resetTimeout))
    }
  }, [signOut])

  if (accessState === null) return <main className="fixed inset-0 z-[100] grid place-items-center bg-[#071520] text-white">Checking access...</main>
  if (accessState !== "active") {
    const blocked = accessState === "blocked"
    const updates = accessState === "updates"
    return <main className="fixed inset-0 z-[100] grid min-h-screen place-items-center overflow-hidden bg-[#071520] px-6 py-12 text-white"><div className="relative w-full max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b865]">DDNI member access</p><div className="mx-auto my-8 h-px w-16 bg-[#d8b865]/60" /><h1 className="font-display text-4xl leading-tight sm:text-6xl">{blocked ? "Dashboard access is restricted." : updates ? "Updates to the dashboard are being made." : "Your dashboard is being prepared."}</h1><p className="mx-auto mt-6 max-w-lg text-base leading-8 text-white/65 sm:text-lg">{blocked ? "You have been blocked from using the dashboard. Reach out to admin at Info@distinguisheddaniel.com." : updates ? "We are making updates to the dashboard. Please check back soon." : "We are preparing your dashboard with care. Look out for an email when it is ready."}</p><a href="/" className="mt-10 inline-flex rounded-full border border-[#d8b865]/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d27a]">Return to home</a></div></main>
  }

  return (
    <div className="tdd-dashboard flex min-h-screen flex-col">
      <AnnouncementBar />
      {isTimedOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050f18]/90 p-6 backdrop-blur-sm" role="status">
          <div className="w-full max-w-md rounded-2xl border border-[#dcb567]/30 bg-[#0c1e2c] p-8 text-center shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#dcb567]">Session ended</p>
            <h2 className="mt-3 font-display text-2xl text-white">For your security, you&apos;ve been signed out.</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Your dashboard session expired after 5 minutes of inactivity.</p>
            <a href="/" className="mt-6 inline-flex rounded-full bg-[#dcb567] px-5 py-3 text-sm font-semibold text-[#1a1200] transition hover:opacity-90">Return to home</a>
          </div>
        </div>
      )}
      <SidebarProvider className="min-h-0 flex-1">
        <AppSidebar activeView={activeView} onNavigate={setActiveView} member={member} />
        <SidebarInset>
          <DashboardHeader activeView={activeView} onNavigate={setActiveView} member={member} />
          <div className="relative flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="p-4 sm:p-6 lg:p-8"
              >
                {activeView === "overview" && (
                  <OverviewView onNavigate={setActiveView} opportunities={adminOpportunities} />
                )}
                {activeView === "institute" && <InstituteView />}
                {activeView === "network" && <NetworkView opportunities={adminOpportunities} />}
                {activeView === "profile" && <><ProfileEditor /><ProfileView /></>}
                {activeView === "settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
