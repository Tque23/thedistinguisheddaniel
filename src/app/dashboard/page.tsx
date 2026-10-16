import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell, type DashboardMember } from "@/components/dashboard/dashboard-shell"
import { initialsFor } from "@/lib/dashboard-data"
import "./dashboard.css"

export const metadata: Metadata = {
  title: "Member Dashboard | The Distinguished Daniel Network and Institute",
  description:
    "Your Institute courses, resources, and Network opportunities in one place.",
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "")

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth")
  }

  const metadata = user.user_metadata ?? {}
  const firstLastName = [text(metadata.first_name), text(metadata.last_name)].filter(Boolean).join(" ")
  const name = text(metadata.full_name) || text(metadata.name) || firstLastName || user.email?.split("@")[0] || "Member"
  const preferences = (metadata.preferences ?? {}) as Record<string, unknown>

  const member: DashboardMember = {
    id: user.id,
    name,
    email: user.email ?? "",
    avatarUrl: text(metadata.avatar_url) || text(metadata.picture),
    title: text(metadata.title) || text(metadata.role) || "DDNI Member",
    tier: text(metadata.tier) || "DDNI",
    location: text(metadata.location),
    memberSince: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(user.created_at)),
    initials: initialsFor(name),
    avatarColor: "#dcb567",
    isAdmin: user.app_metadata?.is_admin === true,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? "",
    emailConfirmedAt: user.email_confirmed_at ?? "",
    pendingEmail: user.new_email ?? "",
    profileStatus: text(metadata.professional_profile_status),
    lastProfileSavedAt: text(metadata.last_profile_saved_at),
    profileReviewedAt: text(metadata.profile_reviewed_at),
    profileReviewNote: text(metadata.profile_review_note),
    passwordChangedAt: text(metadata.password_changed_at),
    emailChangeRequestedAt: text(metadata.email_change_requested_at),
    preferences: {
      emailUpdates: preferences.email_updates !== false,
      networkAlerts: preferences.network_alerts !== false,
    },
  }

  return <DashboardShell member={member} />
}
