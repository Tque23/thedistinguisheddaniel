import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/admin-dashboard"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth?next=%2Fadmin")
  if (user.app_metadata?.is_admin !== true) redirect("/dashboard")
  return <AdminDashboard />
}
