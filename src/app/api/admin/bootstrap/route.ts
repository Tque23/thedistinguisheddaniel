import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN
  const providedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  if (!expectedToken) return NextResponse.json({ error: "Administrator bootstrap is not configured" }, { status: 503 })
  const expected = Buffer.from(expectedToken)
  const provided = Buffer.from(providedToken)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || !("email" in body) || !("password" in body)
    || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }
  const email = body.email.trim().toLowerCase()
  const password = body.password
  const allowedEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase()
  if (!allowedEmail || email !== allowedEmail || password.length < 12) {
    return NextResponse.json({ error: "Invalid bootstrap account details" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return NextResponse.json({ error: "Unable to check administrator account" }, { status: 500 })
  const existing = users.users.find((user) => user.email?.toLowerCase() === email)
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, app_metadata: { ...existing.app_metadata, is_admin: true }, user_metadata: { ...existing.user_metadata, full_name: "The Distinguished Daniel Admin" } })
    if (error) return NextResponse.json({ error: "Unable to prepare administrator access" }, { status: 500 })
  } else {
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { is_admin: true }, user_metadata: { full_name: "The Distinguished Daniel Admin" } })
    if (error) return NextResponse.json({ error: "Unable to prepare admin access" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
