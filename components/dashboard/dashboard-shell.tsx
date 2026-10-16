"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { HistoryView } from "@/components/dashboard/views/history-view"
import { SupportView } from "@/components/dashboard/views/support-view"
import {
  emptyProfile,
  toCourse,
  toDirectoryMember,
  toOpportunity,
  toProfile,
  toResource,
  type Course,
  type DirectoryMember,
  type MemberProfile,
  type Opportunity,
  type Resource,
} from "@/lib/dashboard-data"

export const DASHBOARD_VIEWS = ["overview", "institute", "network", "profile", "history", "settings", "support"] as const
export type DashboardView = (typeof DASHBOARD_VIEWS)[number]

const SESSION_TIMEOUT_MS = 5 * 60 * 1000
const RESERVED_ANNOUNCEMENTS = `("__dashboard_announcement__","__landing_announcement__")`

export type DashboardMember = {
  id: string
  name: string
  email: string
  avatarUrl: string
  title: string
  tier: string
  location: string
  memberSince: string
  initials: string
  avatarColor: string
  isAdmin: boolean
  createdAt: string
  lastSignInAt: string
  emailConfirmedAt: string
  pendingEmail: string
  profileStatus: string
  lastProfileSavedAt: string
  profileReviewedAt: string
  profileReviewNote: string
  passwordChangedAt: string
  emailChangeRequestedAt: string
  preferences: { emailUpdates: boolean; networkAlerts: boolean }
}

export type DashboardData = {
  loading: boolean
  opportunities: Opportunity[]
  courses: Course[]
  resources: Resource[]
  profile: MemberProfile
  directory: DirectoryMember[]
  errors: Partial<Record<"opportunities" | "courses" | "resources" | "profile" | "directory", string>>
}

const initialData: DashboardData = {
  loading: true,
  opportunities: [],
  courses: [],
  resources: [],
  profile: emptyProfile,
  directory: [],
  errors: {},
}

function isDashboardView(value: string | null): value is DashboardView {
  return DASHBOARD_VIEWS.includes(value as DashboardView)
}

export function DashboardShell({ member: initialMember }: { member: DashboardMember }) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<DashboardView>("overview")
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [accessState, setAccessState] = useState<"prepared" | "updates" | "active" | "blocked" | null>(null)
  const [member, setMember] = useState<DashboardMember>(initialMember)
  const [data, setData] = useState<DashboardData>(initialData)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const signOut = useCallback(async () => {
    await createClient().auth.signOut()
    router.replace("/auth?timeout=1")
    router.refresh()
  }, [router])

  const navigate = useCallback((view: DashboardView) => {
    setActiveView(view)
    scrollRef.current?.scrollTo({ top: 0 })
    const url = new URL(window.location.href)
    if (view === "overview") url.searchParams.delete("view")
    else url.searchParams.set("view", view)
    if (url.href !== window.location.href) window.history.pushState({ view }, "", url)
  }, [])

  useEffect(() => {
    const syncFromUrl = () => {
      const view = new URLSearchParams(window.location.search).get("view")
      setActiveView(isDashboardView(view) ? view : "overview")
    }
    syncFromUrl()
    window.addEventListener("popstate", syncFromUrl)
    return () => window.removeEventListener("popstate", syncFromUrl)
  }, [])

  useEffect(() => {
    document.body.classList.add("tdd-dashboard-theme")
    return () => document.body.classList.remove("tdd-dashboard-theme")
  }, [])

  const loadData = useCallback(async (userId: string) => {
    const client = createClient()
    const [opportunities, courses, resources, profile, directory] = await Promise.all([
      client.from("announcements").select("id, title, body, created_at").eq("published", true).not("title", "in", RESERVED_ANNOUNCEMENTS).order("created_at", { ascending: false }).limit(50),
      client.from("courses").select("*").eq("published", true).order("created_at", { ascending: false }),
      client.from("resources").select("*").eq("published", true).order("created_at", { ascending: false }),
      client.from("member_profiles").select("*").eq("id", userId).maybeSingle(),
      client.from("member_profiles").select("*").neq("id", userId).limit(60),
    ])
    setData({
      loading: false,
      opportunities: (opportunities.data || []).map(toOpportunity),
      courses: (courses.data || []).map(toCourse),
      resources: (resources.data || []).map(toResource),
      profile: toProfile(profile.data),
      directory: (directory.data || []).map(toDirectoryMember),
      errors: {
        opportunities: opportunities.error ? "We couldn't load opportunities." : undefined,
        courses: courses.error ? "We couldn't load courses." : undefined,
        resources: resources.error ? "We couldn't load resources." : undefined,
        profile: profile.error ? "We couldn't load your professional profile." : undefined,
        directory: directory.error ? "We couldn't load the member directory." : undefined,
      },
    })
  }, [])

  useEffect(() => {
    void createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return setAccessState("prepared")
      const state = user.app_metadata?.is_admin === true
        ? "active"
        : (user.user_metadata?.dashboard_status as "prepared" | "updates" | "active" | "blocked" | undefined) || "prepared"
      setAccessState(state)
      if (state === "active") void loadData(user.id)
    })
  }, [loadData])

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

  const updateMember = useCallback((updates: Partial<DashboardMember>) => setMember((current) => ({ ...current, ...updates })), [])
  const updateProfile = useCallback((profile: MemberProfile) => setData((current) => ({ ...current, profile, errors: { ...current.errors, profile: undefined } })), [])

  const viewProps = useMemo(() => ({ member, data, onNavigate: navigate }), [member, data, navigate])

  if (accessState === null) return <main className="fixed inset-0 z-[100] grid place-items-center bg-[#071520] text-white" role="status" aria-live="polite"><div className="flex flex-col items-center gap-4"><div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-[#d8b865]" /><span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b865]">Loading dashboard</span></div></main>
  if (accessState !== "active") {
    const blocked = accessState === "blocked"
    const updates = accessState === "updates"
    return <main className="fixed inset-0 z-[100] grid min-h-screen place-items-center overflow-hidden bg-[#071520] px-6 py-12 text-white"><div className="relative w-full max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b865]">DDNI member access</p><div className="mx-auto my-8 h-px w-16 bg-[#d8b865]/60" /><h1 className="font-display text-4xl leading-tight sm:text-6xl">{blocked ? "Dashboard access is restricted." : updates ? "Updates to the dashboard are being made." : "Your dashboard is being prepared."}</h1><p className="mx-auto mt-6 max-w-lg text-base leading-8 text-white/65 sm:text-lg">{blocked ? "You have been blocked from using the dashboard. Reach out to admin at Info@distinguisheddaniel.com." : updates ? "We are making updates to the dashboard. Please check back soon." : "We are preparing your dashboard with care. Look out for an email when it is ready."}</p><a href="/" className="mt-10 inline-flex rounded-full border border-[#d8b865]/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d27a]">Return to home</a></div></main>
  }

  return (
    <div className="tdd-dashboard flex h-svh flex-col overflow-hidden">
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
        <AppSidebar activeView={activeView} onNavigate={navigate} member={member} />
        <SidebarInset className="min-h-0 min-w-0">
          <DashboardHeader activeView={activeView} onNavigate={navigate} member={member} data={data} />
          <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"
              >
                {activeView === "overview" && <OverviewView {...viewProps} />}
                {activeView === "institute" && <InstituteView {...viewProps} />}
                {activeView === "network" && <NetworkView {...viewProps} />}
                {activeView === "profile" && <ProfileView {...viewProps} onMemberChange={updateMember} onProfileChange={updateProfile} />}
                {activeView === "history" && <HistoryView {...viewProps} />}
                {activeView === "settings" && <SettingsView {...viewProps} onMemberChange={updateMember} />}
                {activeView === "support" && <SupportView {...viewProps} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export type DashboardViewProps = {
  member: DashboardMember
  data: DashboardData
  onNavigate: (view: DashboardView) => void
}
