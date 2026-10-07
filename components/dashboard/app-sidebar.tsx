"use client"

import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { currentMember } from "@/lib/dashboard-data"
import { GraduationCap, LayoutGrid, Settings, UserRound, Users2, ShieldCheck } from "lucide-react"
import type { DashboardView } from "@/components/dashboard/dashboard-shell"

const navItems: { id: DashboardView; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "institute", label: "The Institute", icon: GraduationCap },
  { id: "network", label: "The Network", icon: Users2 },
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AppSidebar({
  activeView,
  onNavigate,
}: {
  activeView: DashboardView
  onNavigate: (view: DashboardView) => void
}) {
  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <img
            src="/logos/TDD Network Logo Line Full.svg"
            alt="TDD Network"
            className="h-6 w-auto shrink-0 object-contain group-data-[collapsible=icon]:hidden"
          />
          <img
            src="/TDDCrest.svg"
            alt="TDD Crest"
            className="h-6 w-auto shrink-0 object-contain group-data-[collapsible=icon]:block hidden"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    tooltip={item.label}
                    onClick={() => onNavigate(item.id)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Admin dashboard" onClick={() => { window.location.href = "/admin" }}>
                  <ShieldCheck /><span>Admin dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ backgroundColor: currentMember.avatarColor, color: "#1a1200" }}
          >
            {currentMember.initials}
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {currentMember.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {currentMember.tier} Member
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
