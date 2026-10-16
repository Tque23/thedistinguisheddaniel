"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { relativeTime } from "@/lib/dashboard-data"
import { Bell, BookOpen, FileText, Users2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardData, DashboardView } from "@/components/dashboard/dashboard-shell"

const SEEN_KEY = "ddni-notifications-seen-at"

type NotificationItem = { id: string; title: string; description: string; createdAt: string; view: DashboardView; icon: typeof Bell; source: "Institute" | "Network" }

export function NotificationsMenu({ data, onNavigate }: { data: DashboardData; onNavigate: (view: DashboardView) => void }) {
  const [seenAt, setSeenAt] = useState(0)

  useEffect(() => {
    setSeenAt(Number(window.localStorage.getItem(SEEN_KEY) || 0))
  }, [])

  const items = useMemo<NotificationItem[]>(() => [
    ...data.opportunities.map((item) => ({ id: `op-${item.id}`, title: "New opportunity", description: item.title, createdAt: item.createdAt, view: "network" as const, icon: Users2, source: "Network" as const })),
    ...data.courses.map((item) => ({ id: `course-${item.id}`, title: "New course", description: item.title, createdAt: item.createdAt, view: "institute" as const, icon: BookOpen, source: "Institute" as const })),
    ...data.resources.map((item) => ({ id: `res-${item.id}`, title: "New resource", description: item.title, createdAt: item.createdAt, view: "institute" as const, icon: FileText, source: "Institute" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8), [data])

  const isUnread = (item: NotificationItem) => new Date(item.createdAt).getTime() > seenAt
  const unreadCount = items.filter(isUnread).length

  function markAllRead() {
    const now = Date.now()
    window.localStorage.setItem(SEEN_KEY, String(now))
    setSeenAt(now)
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open && unreadCount > 0) markAllRead() }}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : "Notifications"}>
            <Bell />
            {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 flex size-2 rounded-full bg-[#c4283a]" />}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between px-1.5">
            <span>Notifications</span>
            {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {data.loading ? "Loading updates…" : "You're all caught up. New courses, resources and opportunities will appear here."}
            </p>
          )}
          {items.map((item) => (
            <DropdownMenuItem key={item.id} className="flex items-start gap-2.5 py-2" onClick={() => onNavigate(item.view)}>
              <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", item.source === "Institute" ? "bg-[#dcb567]/15 text-[#f3d27a]" : "bg-[#1d3557]/60 text-[#a9c7f3]")}>
                <item.icon className="size-3.5" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  {isUnread(item) && <span className="size-1.5 shrink-0 rounded-full bg-[#c4283a]" />}
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">{item.description}</span>
                <span className="text-xs text-muted-foreground/70">{relativeTime(item.createdAt)}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={markAllRead} className="justify-center text-xs text-muted-foreground">Mark all as read</DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
