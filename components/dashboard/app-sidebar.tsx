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
import { Bell, BookOpen, BriefcaseBusiness, CalendarDays, House, LayoutGrid, Library, Settings, ShieldCheck, UserRound, Users2, Award } from "lucide-react"
import type { DashboardMember, DashboardView } from "@/components/dashboard/dashboard-shell"
type NavItem = { id: DashboardView; label: string; icon: typeof LayoutGrid }

const navItems: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "institute", label: "My Courses", icon: BookOpen },
  { id: "overview", label: "My Calendar", icon: CalendarDays },
  { id: "institute", label: "Resource Library", icon: Library },
  { id: "profile", label: "My Certificates", icon: Award },
  { id: "network", label: "DDNI Network", icon: Users2 },
  { id: "network", label: "Opportunities", icon: BriefcaseBusiness },
  { id: "overview", label: "Announcements", icon: Bell },
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
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
      <SidebarContent className="px-2 py-5">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item, index) => (
                <SidebarMenuItem key={`${item.label}-${index}`}>
                  <SidebarMenuButton
                    isActive={index === 0 ? activeView === "overview" : false}
                    tooltip={item.label}
                    onClick={() => navigate(item.id)}
                    className="h-9 rounded-lg px-2.5 text-[15px] font-normal text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Back to website" render={<Link href="/" />} className="h-9 rounded-lg px-2.5 text-[15px] font-normal">
                  <House /><span>Back to website</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {member.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Admin dashboard" onClick={() => void openAdminDashboard()} className="h-9 rounded-lg px-2.5 text-[15px] font-normal">
                    <ShieldCheck /><span>Admin dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-5 py-6">
        <blockquote className="text-[16px] leading-[1.45] text-sidebar-foreground">
          “But the people who know their God and carry out great exploits.”
          <cite className="mt-1 block not-italic">Daniel 11:32 (NETV)</cite>
        </blockquote>
      </SidebarFooter>
    </Sidebar>
  )
}
