"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { NotificationsMenu } from "@/components/dashboard/notifications-menu"
import { BookOpen, FileText, History, LifeBuoy, LogOut, Search, Settings, UserRound, Users2 } from "lucide-react"
import type { DashboardData, DashboardMember, DashboardView } from "@/components/dashboard/dashboard-shell"
import { MemberAvatarContent } from "@/components/dashboard/member-avatar"

const viewTitles: Record<DashboardView, { title: string; subtitle: string }> = {
  overview: { title: "Welcome back", subtitle: "Here's what's happening across your Institute and Network." },
  institute: { title: "The Institute", subtitle: "Courses and resources curated for your growth." },
  network: { title: "The Network", subtitle: "Discover opportunities and connect with fellow members." },
  profile: { title: "My Profile", subtitle: "Manage your public member profile and professional presence." },
  history: { title: "Account History", subtitle: "A record of key activity on your member account." },
  settings: { title: "Settings", subtitle: "Manage your account, security, and communication preferences." },
  support: { title: "Support", subtitle: "Get help from the DDNI team." },
}

type SearchResult = { id: string; label: string; detail: string; view: DashboardView; icon: typeof Search }

export function DashboardHeader({ activeView, onNavigate, member, data }: { activeView: DashboardView; onNavigate: (view: DashboardView) => void; member: DashboardMember; data: DashboardData }) {
  const copy = viewTitles[activeView]
  const router = useRouter()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const firstName = member.name.split(" ")[0]

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const matches = (...values: string[]) => values.some((value) => value.toLowerCase().includes(q))
    return [
      ...data.courses.filter((c) => matches(c.title, c.instructor, c.category)).map((c) => ({ id: `c-${c.id}`, label: c.title, detail: "Course", view: "institute" as const, icon: BookOpen })),
      ...data.resources.filter((r) => matches(r.title, r.type, r.description)).map((r) => ({ id: `r-${r.id}`, label: r.title, detail: "Resource", view: "institute" as const, icon: FileText })),
      ...data.opportunities.filter((o) => matches(o.title, o.description)).map((o) => ({ id: `o-${o.id}`, label: o.title, detail: "Opportunity", view: "network" as const, icon: Users2 })),
      ...data.directory.filter((m) => matches(m.name, m.company, m.headline, ...m.skills)).map((m) => ({ id: `m-${m.id}`, label: m.name, detail: "Member", view: "network" as const, icon: UserRound })),
    ].slice(0, 8)
  }, [query, data])

  function choose(result: SearchResult) {
    onNavigate(result.view)
    setQuery("")
    setSearchOpen(false)
    inputRef.current?.blur()
  }

  function goTo(view: DashboardView) {
    setProfileMenuOpen(false)
    onNavigate(view)
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace("/")
    router.refresh()
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
          {activeView === "overview" ? `${copy.title}, ${firstName}` : copy.title}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{copy.subtitle}</p>
      </div>

      <div className="relative hidden min-w-0 max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setSearchOpen(true) }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setQuery(""); setSearchOpen(false) }
            if (event.key === "Enter" && results[0]) { event.preventDefault(); choose(results[0]) }
          }}
          placeholder="Search courses, resources, members…"
          aria-label="Search the dashboard"
          className="h-8 bg-muted/40 pl-8 text-sm"
        />
        {searchOpen && query.trim().length >= 2 && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-xl" role="listbox">
            {results.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches for “{query.trim()}”.</p>
            ) : results.map((result) => (
              <button
                key={result.id}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(result)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <result.icon className="size-3.5 shrink-0 text-[#f3d27a]" />
                <span className="min-w-0 flex-1 truncate text-foreground">{result.label}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{result.detail}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Link href="/" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground sm:inline-flex">
        Home
      </Link>

      <NotificationsMenu data={data} onNavigate={onNavigate} />

      <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="sm" className="h-9 gap-2 pl-1.5 pr-2.5" aria-label={`Open profile menu for ${member.name}`}>
              <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold" style={{ backgroundColor: member.avatarColor, color: "#1a1200" }}>
                <MemberAvatarContent member={member} />
              </div>
              <span className="hidden text-sm font-medium sm:inline">{firstName}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 px-1.5 py-1.5">
              <span className="truncate text-sm font-medium text-foreground">{member.name}</span>
              <span className="truncate text-xs text-muted-foreground">{member.email || member.title}</span>
              <Badge variant="outline" className="mt-1 w-fit text-[10px]">{member.isAdmin ? "Administrator" : "DDNI Member"}</Badge>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => goTo("profile")}><UserRound />My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => goTo("history")}><History />Account History</DropdownMenuItem>
            <DropdownMenuItem onClick={() => goTo("settings")}><Settings />Account Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => goTo("support")}><LifeBuoy />Support</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}><LogOut />Sign Out</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
