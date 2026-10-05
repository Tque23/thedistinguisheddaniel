"use client"

import { useState } from "react"
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
import { notifications as initialNotifications } from "@/lib/dashboard-data"
import { Bell, GraduationCap, Users2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotificationsMenu() {
  const [items, setItems] = useState(initialNotifications)
  const unreadCount = items.filter((n) => !n.read).length

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setItems((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex size-2 rounded-full bg-[#c4283a]" />
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between px-1.5">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {items.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-start gap-2.5 py-2"
            >
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                  notification.source === "Institute"
                    ? "bg-[#dcb567]/15 text-[#f3d27a]"
                    : "bg-[#1d3557]/60 text-[#a9c7f3]"
                )}
              >
                {notification.source === "Institute" ? (
                  <GraduationCap className="size-3.5" />
                ) : (
                  <Users2 className="size-3.5" />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {notification.title}
                  </span>
                  {!notification.read && (
                    <span className="size-1.5 shrink-0 rounded-full bg-[#c4283a]" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.description}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {notification.time}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
