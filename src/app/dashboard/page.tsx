import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
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

  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Member")
  const member = {
    name,
    title: String(user.user_metadata?.title || user.user_metadata?.role || "DDNI Member"),
    initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    avatarColor: "#dcb567",
    isAdmin: user.app_metadata?.is_admin === true,
  }

  return <DashboardShell member={member} />
}
