import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== "admin@distinguisheddaniel.com" || user.app_metadata?.is_admin !== true) return null
  return user
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: "Unable to load users" }, { status: 500 })
  return NextResponse.json({ users: data.users.map((user) => ({ id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at, email_confirmed_at: user.email_confirmed_at, user_metadata: user.user_metadata, app_metadata: user.app_metadata })) })
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await request.json()
  if (typeof body.id !== "string") return NextResponse.json({ error: "Invalid user" }, { status: 400 })
  const updates: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; ban_duration?: string } = {}
  if (typeof body.email === "string" && body.email.trim()) updates.email = body.email.trim().toLowerCase()
  if (body.user_metadata && typeof body.user_metadata === "object") updates.user_metadata = body.user_metadata
  if (typeof body.dashboard_status === "string" && ["prepared", "updates", "active", "blocked"].includes(body.dashboard_status)) updates.user_metadata = { dashboard_status: body.dashboard_status }
  if (typeof body.is_admin === "boolean") updates.app_metadata = { is_admin: body.is_admin }
  if (typeof body.ban_duration === "string") updates.ban_duration = body.ban_duration
  const { data, error } = await createAdminClient().auth.admin.updateUserById(body.id, updates)
  if (error) return NextResponse.json({ error: "Unable to update user" }, { status: 400 })
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata, app_metadata: data.user.app_metadata } })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await request.json()
  if (typeof body.id !== "string" || body.id === admin.id) return NextResponse.json({ error: "Invalid user" }, { status: 400 })
  const { error } = await createAdminClient().auth.admin.deleteUser(body.id)
  if (error) return NextResponse.json({ error: "Unable to delete user" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
