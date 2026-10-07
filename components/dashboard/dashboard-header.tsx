"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { currentMember } from "@/lib/dashboard-data"
import { LogOut, Search, Settings, UserRound } from "lucide-react"
import type { DashboardView } from "@/components/dashboard/dashboard-shell"

const viewTitles: Record<DashboardView, { title: string; subtitle: string }> = {
  overview: {
    title: "Welcome back",
    subtitle: "Here's what's happening across your Institute and Network.",
  },
  institute: {
    title: "The Institute",
    subtitle: "Continue your learning path and explore the resource library.",
  },
  network: {
    title: "The Network",
    subtitle: "Discover opportunities and connect with fellow members.",
  },
  profile: {
    title: "My Profile",
    subtitle: "Manage your public member profile and professional presence.",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your account, security, and communication preferences.",
  },
}

export function DashboardHeader({ activeView, onNavigate }: { activeView: DashboardView; onNavigate: (view: DashboardView) => void }) {
  const copy = viewTitles[activeView]
  const router = useRouter()

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
          {copy.title}, {currentMember.name.split(" ")[0]}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {copy.subtitle}
        </p>
      </div>

      <div className="relative hidden min-w-0 max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members, resources..."
          className="h-8 bg-muted/40 pl-8 text-sm"
        />
      </div>

      <Link href="/" className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground sm:inline-flex">
        Home
      </Link>

      <NotificationsMenu />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 pl-1.5 pr-2.5"
            >
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: currentMember.avatarColor,
                  color: "#1a1200",
                }}
              >
                {currentMember.initials}
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {currentMember.name.split(" ")[0]}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-1.5 py-1.5">
            <span className="text-sm font-medium text-foreground">
              {currentMember.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentMember.title}
            </span>
            <Badge variant="outline" className="mt-1 w-fit text-[10px]">
              {currentMember.tier} Member
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onNavigate("profile")} onSelect={() => onNavigate("profile")}>
              <UserRound />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("settings")}>
              <Settings />
              Account Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={handleSignOut} onSelect={handleSignOut}>
              <LogOut />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
