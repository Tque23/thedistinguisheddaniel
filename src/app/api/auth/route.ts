import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SITE_ORIGIN = "https://distinguisheddaniel.com"
const SIGNUP_REDIRECT_TO = `${SITE_ORIGIN}/auth/callback?next=%2Fdashboard`
const RECOVERY_REDIRECT_TO = `${SITE_ORIGIN}/auth/callback?next=%2Fauth%3Fmode%3Dreset`

type AuthAction =
  | { action: "sign_up"; email: string; password: string; name: string }
  | { action: "sign_in"; email: string; password: string }
  | { action: "resend_signup"; email: string }
  | { action: "request_password_reset"; email: string }
  | { action: "update_password"; password: string }
  | { action: "change_password"; password: string }
  | { action: "change_email"; email: string }
  | { action: "sign_out"; scope: "global" | "local" | "others" }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validEmail(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= 320
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function parseAction(body: unknown): AuthAction | null {
  if (!isRecord(body) || typeof body.action !== "string") return null
  if (body.action === "sign_up"
    && validEmail(body.email)
    && typeof body.password === "string" && body.password.length >= 6 && body.password.length <= 256
    && typeof body.name === "string" && body.name.trim().length >= 2 && body.name.trim().length <= 80) {
    return { action: "sign_up", email: body.email.trim().toLowerCase(), password: body.password, name: body.name.trim() }
  }
  if (body.action === "sign_in"
    && validEmail(body.email)
    && typeof body.password === "string" && body.password.length > 0 && body.password.length <= 256) {
    return { action: "sign_in", email: body.email.trim().toLowerCase(), password: body.password }
  }
  if (body.action === "resend_signup" && validEmail(body.email)) {
    return { action: "resend_signup", email: body.email.trim().toLowerCase() }
  }
  if (body.action === "request_password_reset" && validEmail(body.email)) {
    return { action: "request_password_reset", email: body.email.trim().toLowerCase() }
  }
  if (body.action === "update_password"
    && typeof body.password === "string" && body.password.length >= 6 && body.password.length <= 256) {
    return { action: "update_password", password: body.password }
  }
  if (body.action === "change_password"
    && typeof body.password === "string" && body.password.length >= 8 && body.password.length <= 256) {
    return { action: "change_password", password: body.password }
  }
  if (body.action === "change_email" && validEmail(body.email)) {
    return { action: "change_email", email: body.email.trim().toLowerCase() }
  }
  if (body.action === "sign_out"
    && (body.scope === "global" || body.scope === "local" || body.scope === "others")) {
    return { action: "sign_out", scope: body.scope }
  }
  return null
}

function respond(body: { ok: true; message?: string; changedAt?: string } | { ok: false; error: string }, status = 200) {
  const response = NextResponse.json(body, { status })
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}

export async function POST(request: Request) {
  const requestOrigin = request.headers.get("origin")
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return respond({ ok: false, error: "Unable to process this request." }, 403)
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return respond({ ok: false, error: "Invalid request." }, 415)
  }

  let action: AuthAction | null
  try {
    action = parseAction(await request.json())
  } catch {
    action = null
  }
  if (!action) return respond({ ok: false, error: "Please review the details and try again." }, 400)

  try {
    const supabase = await createClient()
    switch (action.action) {
      case "sign_up": {
        const { error } = await supabase.auth.signUp({
          email: action.email,
          password: action.password,
          options: { emailRedirectTo: SIGNUP_REDIRECT_TO, data: { full_name: action.name } },
        })
        if (error) {
          console.error("[auth] Sign-up failed", error)
          if (error.code === "user_already_exists") {
            return respond({ ok: true, message: "If an account exists for that email, a confirmation link will be sent." })
          }
          return respond({ ok: false, error: "Unable to complete sign-up. Please try again." }, 400)
        }
        return respond({ ok: true, message: "Check your email for a confirmation link." })
      }
      case "sign_in": {
        const { error } = await supabase.auth.signInWithPassword({ email: action.email, password: action.password })
        if (error) {
          console.error("[auth] Sign-in failed", error)
          return respond({ ok: false, error: "Invalid email or password." }, 401)
        }
        return respond({ ok: true })
      }
      case "resend_signup": {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: action.email,
          options: { emailRedirectTo: SIGNUP_REDIRECT_TO },
        })
        if (error) {
          console.error("[auth] Signup resend failed", error)
          return respond({ ok: false, error: "Unable to send a new link. Please try again." }, 400)
        }
        return respond({ ok: true, message: "New link sent! Check your inbox." })
      }
      case "request_password_reset": {
        const { error } = await supabase.auth.resetPasswordForEmail(action.email, {
          redirectTo: RECOVERY_REDIRECT_TO,
        })
        if (error) {
          console.error("[auth] Password reset request failed", error)
          return respond({ ok: false, error: "Unable to send a reset email. Please try again." }, 400)
        }
        return respond({ ok: true, message: "If an account exists for that email, you'll receive a password reset link shortly." })
      }
      case "update_password": {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error("[auth] Password reset session lookup failed", userError)
          return respond({ ok: false, error: "Your reset link is invalid or has expired. Request a new one." }, 401)
        }
        if (!user) return respond({ ok: false, error: "Your reset link is invalid or has expired. Request a new one." }, 401)
        const { error } = await supabase.auth.updateUser({ password: action.password })
        if (error) {
          console.error("[auth] Password update failed", error)
          return respond({ ok: false, error: "Unable to update your password. Request a new reset link and try again." }, 400)
        }
        return respond({ ok: true, message: "Your password has been updated. You can now log in." })
      }
      case "change_password": {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error("[auth] Password change session lookup failed", userError)
          return respond({ ok: false, error: "Please sign in again before changing your password." }, 401)
        }
        if (!user) return respond({ ok: false, error: "Please sign in again before changing your password." }, 401)
        const changedAt = new Date().toISOString()
        const { error } = await supabase.auth.updateUser({
          password: action.password,
          data: { password_changed_at: changedAt },
        })
        if (error) {
          console.error("[auth] Password change failed", error)
          return respond({ ok: false, error: "We couldn't update your password. Please try again." }, 400)
        }
        return respond({ ok: true, changedAt })
      }
      case "change_email": {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error("[auth] Email change session lookup failed", userError)
          return respond({ ok: false, error: "Please sign in again before changing your email." }, 401)
        }
        if (!user) return respond({ ok: false, error: "Please sign in again before changing your email." }, 401)
        const changedAt = new Date().toISOString()
        const { error } = await supabase.auth.updateUser(
          { email: action.email, data: { email_change_requested_at: changedAt } },
          { emailRedirectTo: `${SITE_ORIGIN}/auth/callback?next=%2Fdashboard%3Fview%3Dsettings` },
        )
        if (error) {
          console.error("[auth] Email change failed", error)
          return respond({ ok: false, error: "We couldn't start the email change. Please try again." }, 400)
        }
        return respond({ ok: true, changedAt, message: "Confirmation sent. Check the email inboxes linked to your account." })
      }
      case "sign_out": {
        const { error } = await supabase.auth.signOut({ scope: action.scope })
        if (error) {
          console.error("[auth] Sign-out failed", error)
          return respond({ ok: false, error: "We couldn't sign you out. Please try again." }, 500)
        }
        return respond({ ok: true })
      }
    }
  } catch (error) {
    console.error("[auth] Auth request failed", error)
    return respond({ ok: false, error: "Unable to complete your request. Please try again." }, 500)
  }
}
