import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const INVALID_LINK_ERROR = "This link is invalid or has expired. Please request a new one."
type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email"
const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])
const SENSITIVE_PARAMS = ["code", "token", "token_hash", "access_token", "refresh_token", "id_token"]
const SENSITIVE_PARAM_SET = new Set([...SENSITIVE_PARAMS, "error", "error_description", "error_code"])

function isEmailOtpType(value: string): value is EmailOtpType {
  return EMAIL_OTP_TYPES.has(value as EmailOtpType)
}

function safeDestination(requestUrl: URL, requestedNext: string | null, type?: EmailOtpType) {
  const fallback = type === "recovery" ? "/auth?mode=reset" : "/dashboard"
  if (!requestedNext || !requestedNext.startsWith("/") || requestedNext.startsWith("//") || requestedNext.includes("\\")) {
    return fallback
  }

  try {
    const destination = new URL(requestedNext, requestUrl)
    if (destination.origin !== requestUrl.origin) return fallback
    for (const param of Array.from(destination.searchParams.keys())) {
      if (SENSITIVE_PARAM_SET.has(param.toLowerCase())) destination.searchParams.delete(param)
    }
    destination.hash = ""
    return `${destination.pathname}${destination.search}`
  } catch {
    return fallback
  }
}

function redirect(requestUrl: URL, path: string, status = 303) {
  const response = NextResponse.redirect(new URL(path, requestUrl), status)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const tokenHash = url.searchParams.get("token_hash")
  const rawType = url.searchParams.get("type")
  const type = rawType && isEmailOtpType(rawType) ? rawType : undefined

  if (url.searchParams.has("error")) {
    return redirect(url, `/auth?error=${encodeURIComponent(INVALID_LINK_ERROR)}`)
  }

  const hasValidCode = Boolean(code && code.length <= 4096)
  const hasValidTokenHash = Boolean(tokenHash && tokenHash.length <= 4096 && type)
  if (!hasValidCode && !hasValidTokenHash) {
    return redirect(url, `/auth?error=${encodeURIComponent(INVALID_LINK_ERROR)}`)
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase server auth is not configured.")
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    if (hasValidCode && code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("[auth/callback] Authorization code exchange failed", error)
        return redirect(url, `/auth?error=${encodeURIComponent(INVALID_LINK_ERROR)}`)
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) {
        console.error("[auth/callback] Token verification failed", error)
        return redirect(url, `/auth?error=${encodeURIComponent(INVALID_LINK_ERROR)}`)
      }
    }

    return redirect(url, safeDestination(url, url.searchParams.get("next"), type))
  } catch (error) {
    console.error("[auth/callback] Callback processing failed", error)
    return redirect(url, `/auth?error=${encodeURIComponent(INVALID_LINK_ERROR)}`)
  }
}
