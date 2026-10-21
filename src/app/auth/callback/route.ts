import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const authError = url.searchParams.get("error")
  const authErrorDescription = url.searchParams.get("error_description")
  const requestedNext = url.searchParams.get("next") || "/dashboard"
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard"
  const isConfirmation = url.searchParams.get("confirmed") === "1"
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } },
  )

  if (authError) {
    const errorUrl = new URL("/auth", url.origin)
    errorUrl.searchParams.set("error", "Authentication could not be completed. Please request a new link and try again.")
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const errorUrl = new URL("/auth", url.origin)
      errorUrl.searchParams.set("error", "This link is invalid or has expired. Please request a new one.")
      return NextResponse.redirect(errorUrl)
    }
  }

  return NextResponse.redirect(new URL(isConfirmation ? "/auth?confirmed=1" : next, url.origin))
}
