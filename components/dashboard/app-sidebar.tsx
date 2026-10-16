"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { GraduationCap, History, House, LayoutGrid, LifeBuoy, Settings, ShieldCheck, UserRound, Users2 } from "lucide-react"
import type { DashboardMember, DashboardView } from "@/components/dashboard/dashboard-shell"
import { MemberAvatarContent } from "@/components/dashboard/member-avatar"

type NavItem = { id: DashboardView; label: string; icon: typeof LayoutGrid }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Member",
    items: [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "institute", label: "The Institute", icon: GraduationCap },
      { id: "network", label: "The Network", icon: Users2 },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "profile", label: "My Profile", icon: UserRound },
      { id: "history", label: "Account History", icon: History },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "support", label: "Support", icon: LifeBuoy },
    ],
  },
]

export function AppSidebar({
  activeView,
  onNavigate,
  member,
}: {
  activeView: DashboardView
  onNavigate: (view: DashboardView) => void
  member: DashboardMember
}) {
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()

  function navigate(view: DashboardView) {
    onNavigate(view)
    if (isMobile) setOpenMobile(false)
  }

  async function openAdminDashboard() {
    const client = createClient()
    await client.auth.refreshSession()
    router.push("/admin")
  }

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-2" aria-label="The Distinguished Daniel home">
          <img
            src="/logos/TDD Network Logo Line Full.svg"
            alt="TDD Network"
            className="h-6 w-auto shrink-0 object-contain group-data-[collapsible=icon]:hidden"
          />
          <img
            src="/TDDCrest.svg"
            alt=""
            className="hidden h-6 w-auto shrink-0 object-contain group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-[#dcb567]/70">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      tooltip={item.label}
                      onClick={() => navigate(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Back to website" render={<Link href="/" />}>
                  <House /><span>Back to website</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {member.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Admin dashboard" onClick={() => void openAdminDashboard()}>
                    <ShieldCheck /><span>Admin dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <button
          type="button"
          onClick={() => navigate("profile")}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label="Open my profile"
        >
          <div
            className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
            style={{ backgroundColor: member.avatarColor, color: "#1a1200" }}
          >
            <MemberAvatarContent member={member} />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{member.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{member.isAdmin ? "Administrator" : "DDNI Member"}</span>
          </div>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
