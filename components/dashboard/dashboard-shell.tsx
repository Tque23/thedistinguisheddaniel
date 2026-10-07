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

export type DashboardView = "overview" | "institute" | "network" | "profile" | "settings"

const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export function DashboardShell() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<DashboardView>("overview")
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const signOut = useCallback(async () => {
    await createClient().auth.signOut()
    router.replace("/auth?timeout=1")
    router.refresh()
  }, [router])

  useEffect(() => {
    void createClient().auth.getUser().then(({ data }) => {
      setIsAdmin(Boolean(data.user?.user_metadata?.is_admin && data.user.email === "admin@distinguisheddaniel.com"))
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

  return (
    <div className="tdd-dashboard flex min-h-screen flex-col">
      <AnnouncementBar />
      {isTimedOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050f18]/90 p-6 backdrop-blur-sm" role="status">
          <div className="w-full max-w-md rounded-2xl border border-[#dcb567]/30 bg-[#0c1e2c] p-8 text-center shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#dcb567]">Session ended</p>
            <h2 className="mt-3 font-display text-2xl text-white">For your security, you&apos;ve been signed out.</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Your dashboard session expired after 30 minutes of inactivity.</p>
            <a href="/" className="mt-6 inline-flex rounded-full bg-[#dcb567] px-5 py-3 text-sm font-semibold text-[#1a1200] transition hover:opacity-90">Return to home</a>
          </div>
        </div>
      )}
      <SidebarProvider className="min-h-0 flex-1">
        <AppSidebar activeView={activeView} onNavigate={setActiveView} />
        <SidebarInset>
          <DashboardHeader activeView={activeView} onNavigate={setActiveView} />
          <div className="relative flex-1 overflow-y-auto">
            {isAdmin === false && (
              <div className="mx-4 mt-4 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-sm text-foreground sm:mx-6 lg:mx-8">
                <p className="font-semibold">Your dashboard is being prepared.</p>
                <p className="mt-1 text-muted-foreground">Look out for an email when it&apos;s ready. We&apos;ll let you know as soon as your member access is available.</p>
              </div>
            )}
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
                  <OverviewView onNavigate={setActiveView} />
                )}
                {activeView === "institute" && <InstituteView />}
                {activeView === "network" && <NetworkView />}
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
