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
import { cormorantGaramond } from "@/src/app/fonts"
type NavItem = { id: DashboardView; label: string; icon: typeof LayoutGrid }

const navItems: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutGrid },
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "calendar", label: "My Calendar", icon: CalendarDays },
  { id: "library", label: "Resource Library", icon: Library },
  { id: "history", label: "My Certificates", icon: Award },
  { id: "network", label: "DDNI Network", icon: Users2 },
  { id: "opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { id: "announcements", label: "Announcements", icon: Bell },
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
      <SidebarHeader className="border-b border-sidebar-border/70 px-2 py-3">
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
      <SidebarContent className="px-2 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item, index) => (
                <SidebarMenuItem key={`${item.label}-${index}`}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    tooltip={item.label}
                    onClick={() => navigate(item.id)}
                    className="h-10 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/90 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sidebar-ring)] data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm"
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
                <SidebarMenuButton tooltip="Back to website" render={<Link href="/" />} className="h-10 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150">
                  <House /><span>Back to website</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {member.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Admin dashboard" onClick={() => void openAdminDashboard()} className="h-10 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150">
                    <ShieldCheck /><span>Admin dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="max-h-40 overflow-hidden border-t border-sidebar-border/70 px-5 py-5 motion-safe:transition-[max-height,opacity,translate,padding] motion-safe:duration-200 motion-safe:ease-out motion-safe:group-data-[collapsible=icon]:translate-y-2 group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:px-5 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
        <blockquote className={`${cormorantGaramond.className} text-base leading-relaxed text-sidebar-foreground`}>
          “But the people who know their God and carry out great exploits.”
          <cite className="mt-1 block text-sm not-italic text-[#d8b865]">Daniel 11:32 (NETV)</cite>
        </blockquote>
      </SidebarFooter>
    </Sidebar>
  )
}
