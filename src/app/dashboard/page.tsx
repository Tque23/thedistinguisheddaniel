import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell, type DashboardMember } from "@/components/dashboard/dashboard-shell"
import "./dashboard.css"

export const metadata: Metadata = {
  title: "Member Dashboard | The Distinguished Daniel Network and Institute",
  description:
    "Your Institute learning path, certifications, and Network opportunities in one place.",
}

export default async function Page() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const metadata = user.user_metadata ?? {}
  const firstLastName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ")
  const name = String(metadata.full_name || metadata.name || firstLastName || user.email?.split("@")[0] || "Member").trim() || "Member"
  const member: DashboardMember = {
    name,
    email: user.email ?? "",
    avatarUrl: String(metadata.avatar_url || metadata.picture || ""),
    title: String(metadata.title || metadata.role || "DDNI Member"),
    tier: String(metadata.tier || "DDNI"),
    location: String(metadata.location || ""),
    memberSince: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(user.created_at)),
    initials: name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M",
    avatarColor: "#dcb567",
    isAdmin: user.app_metadata?.is_admin === true,
  }

  return <DashboardShell member={member} />
}
