import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isUuid, rateLimit } from "@/lib/security"

async function requireAdmin(request?: Request) {
  if (request) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const result = rateLimit(`admin:${forwarded}`, 60)
    if (!result.allowed) return null
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.is_admin !== true) return null
  return user
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: "Unable to load users" }, { status: 500 })
  const { data: profiles } = await adminClient.from("member_profiles").select("*")
  const profileById = new Map(((profiles || []) as { id: string }[]).map((profile) => [profile.id, profile]))
  return NextResponse.json({ users: data.users.map((user) => ({ id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at, email_confirmed_at: user.email_confirmed_at, user_metadata: user.user_metadata, app_metadata: user.app_metadata, profile: profileById.get(user.id) || null })) })
}

export async function PATCH(request: Request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  if (!isUuid(body.id)) return NextResponse.json({ error: "Invalid user" }, { status: 400 })
  const updates: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; ban_duration?: string } = {}
  if (typeof body.email === "string" && body.email.trim()) updates.email = body.email.trim().toLowerCase()
  if (body.user_metadata && typeof body.user_metadata === "object" && !Array.isArray(body.user_metadata)) updates.user_metadata = body.user_metadata as Record<string, unknown>
  const adminClient = createAdminClient()
  const current = await adminClient.auth.admin.getUserById(body.id)
  if (current.error || !current.data.user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (typeof body.dashboard_status === "string" && ["prepared", "updates", "active", "blocked"].includes(body.dashboard_status)) updates.user_metadata = { ...current.data.user.user_metadata, dashboard_status: body.dashboard_status }
  if (typeof body.is_admin === "boolean") updates.app_metadata = { ...current.data.user.app_metadata, is_admin: body.is_admin }
  if (typeof body.ban_duration === "string") updates.ban_duration = body.ban_duration
  if (typeof body.profile_status === "string" && ["pending_review", "approved", "rejected"].includes(body.profile_status)) {
    const note = typeof body.profile_review_note === "string" ? body.profile_review_note.trim().slice(0, 500) : ""
    updates.user_metadata = { ...(updates.user_metadata || current.data.user.user_metadata), professional_profile_status: body.profile_status, profile_review_note: note, profile_reviewed_at: new Date().toISOString() }
  }
  if (body.resend_verification === true) {
    if (current.data.user.email_confirmed_at) return NextResponse.json({ error: "User is already verified" }, { status: 400 })
    if (!current.data.user.email) return NextResponse.json({ error: "User has no email address" }, { status: 400 })
    const { error } = await adminClient.auth.admin.inviteUserByEmail(current.data.user.email)
    if (error) return NextResponse.json({ error: "Unable to send verification email" }, { status: 400 })
    return NextResponse.json({ ok: true })
  }
  if (body.reset_password === true) {
    const temporaryPassword = typeof body.temporary_password === "string" && body.temporary_password.length >= 8 ? body.temporary_password : `${crypto.randomUUID().slice(0, 8)}Aa!9`
    const { error } = await createAdminClient().auth.admin.updateUserById(body.id, { password: temporaryPassword })
    if (error) return NextResponse.json({ error: "Unable to reset password" }, { status: 400 })
    return NextResponse.json({ ok: true, temporary_password: temporaryPassword })
  }
  const { data, error } = await adminClient.auth.admin.updateUserById(body.id, updates)
  if (error) return NextResponse.json({ error: "Unable to update user" }, { status: 400 })
  if (typeof body.dashboard_status === "string") await adminClient.auth.admin.signOut(body.id)
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata, app_metadata: data.user.app_metadata } })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  if (!isUuid(body.id) || body.id === admin.id) return NextResponse.json({ error: "Invalid user" }, { status: 400 })
  const { error } = await createAdminClient().auth.admin.deleteUser(body.id)
  if (error) return NextResponse.json({ error: "Unable to delete user" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
