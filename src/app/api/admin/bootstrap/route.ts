import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (email !== "info@distinguisheddaniel.com" || password !== "W3R$@!d3nD@n!3l") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.users.find((user) => user.email === email)
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password, app_metadata: { ...existing.app_metadata, is_admin: true }, user_metadata: { ...existing.user_metadata, full_name: "The Distinguished Daniel Admin" } })
  } else {
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { is_admin: true }, user_metadata: { full_name: "The Distinguished Daniel Admin" } })
    if (error) return NextResponse.json({ error: "Unable to prepare admin access" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
