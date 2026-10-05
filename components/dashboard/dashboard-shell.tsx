"use client"

import { useState } from "react"
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

export type DashboardView = "overview" | "institute" | "network" | "profile" | "settings"

export function DashboardShell() {
  const [activeView, setActiveView] = useState<DashboardView>("overview")

  return (
    <div className="tdd-dashboard flex min-h-screen flex-col">
      <AnnouncementBar />
      <SidebarProvider className="min-h-0 flex-1">
        <AppSidebar activeView={activeView} onNavigate={setActiveView} />
        <SidebarInset>
          <DashboardHeader activeView={activeView} onNavigate={setActiveView} />
          <div className="relative flex-1 overflow-y-auto">
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
                {activeView === "profile" && <ProfileView />}
                {activeView === "settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
