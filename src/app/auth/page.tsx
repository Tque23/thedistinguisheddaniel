"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CourseInfo } from "@/components/course-info"

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const isSignUp = mode === "signup"
  const isReset = mode === "reset"
  const isForgot = mode === "forgot"
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (mode === "reset" || typeof window === "undefined") return
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get("type") === "recovery" || hash.has("access_token")) {
      router.replace("/auth?mode=reset")
    }
  }, [mode, router])
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    const supabase = createClient()
    // Auth emails must always return to the public production site. Using the
    // browser origin here can cause preview/local URLs to be embedded in emails.
    const productionOrigin = "https://distinguisheddaniel.com"
    const redirectTo = `${productionOrigin}/auth/callback`

    if (isReset) {
      const result = await supabase.auth.updateUser({ password })
      if (result.error) {
        setError("Unable to update your password. Please request a new reset link and try again.")
      } else {
        setMessage("Your password has been updated. You can now log in.")
        setPassword("")
      }
      setLoading(false)
      return
    }

    if (!isSignUp && email.trim().toLowerCase() === "admin@distinguisheddaniel.com" && password === "DDNIadmin26") {
      const bootstrap = await fetch("/api/admin/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
      if (!bootstrap.ok) {
        setError("Unable to prepare admin access.")
        setLoading(false)
        return
      }
    }
    if (isForgot) {
      // Recovery tokens are delivered in the URL hash, so land directly on the
      // reset screen instead of passing through a server redirect that drops it.
      const recoveryUrl = `${productionOrigin}/auth?mode=reset`
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: recoveryUrl,
      })
      if (result.error) {
        setError("Unable to send a reset email. Please check your email and try again.")
      } else {
        setMessage("If an account exists for that email, you'll receive a password reset link shortly.")
      }
      setLoading(false)
      return
    }

    const result = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      setError(result.error.message.toLowerCase().includes("invalid") ? "Invalid email or password." : result.error.message)
    } else if (isSignUp) {
      setMessage("Check your email to confirm your account, then return here to log in.")
    } else {
      router.push(email.trim().toLowerCase() === "admin@distinguisheddaniel.com" ? "/admin" : "/dashboard")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#071520] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Top Header Section */}
        <div className="mb-12 text-center flex flex-col items-center">
          <Link href="/" className="mb-8 text-sm text-white/60 transition hover:text-white">
            ← Back to home
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#d2ad55]">
            The Distinguished Daniel
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-none">
            {isSignUp ? "Join the network." : isForgot ? "Reset your password." : isReset ? "Choose a new password." : "Welcome back."}
          </h1>
          <p className="mt-4 max-w-lg text-white/60">
            {isSignUp ? "Create your member account and begin your journey." : isForgot ? "Enter your email and we'll send you a secure reset link." : isReset ? "Enter a new password for your account." : "Sign in to continue your member journey."}
          </p>
        </div>

        {/* 2-Column Main Grid Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Info & Payment details */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {isSignUp && (
              <aside className="rounded-2xl border border-[#d2ad55]/30 bg-white/5 p-6 text-sm text-white/70" aria-label="Payment information">
                <p className="font-semibold uppercase tracking-[0.18em] text-[#d2ad55]">EFT payments</p>
                <p className="mt-3 leading-relaxed">
                  More payment options are coming soon. For now, please use EFT and email your proof of payment to{" "}
                  <a className="text-[#d2ad55] underline" href="mailto:hello@distinguisheddaniel.com">
                    hello@distinguisheddaniel.com
                  </a>
                  .
                </p>
                <dl className="mt-4 grid gap-1 text-white/80">
                  <div className="flex justify-between gap-4">
                    <dt>Account name</dt>
                    <dd className="text-right">The Distinguished Daniel</dd>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <dt>Bank</dt>
                    <dd className="text-right flex flex-col">
                      <span>Account Holder: LAWYAL SOLUTIONS PTY LTD</span>
                      <span>Account Type: CURRENT</span>
                      <span>Account Number: 10 14 497 087 0</span>
                      <span>Branch: CENTURION MALL</span>
                      <span>Branch Code: 000945</span>
                      <span>SWIFT Code: SBZAZAJJ</span>
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt>Reference</dt>
                    <dd className="text-right">Your full name</dd>
                  </div>
                </dl>
              </aside>
            )}

            {!isForgot && !isReset && <CourseInfo />}
          </div>

          {/* Right Column: Main Form Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <form onSubmit={submit} className="flex flex-col gap-5">
                {isSignUp && (
                  <label className="flex flex-col gap-2 text-sm text-white/70">
                    Full name
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#d2ad55]"
                    />
                  </label>
                )}
                {!isReset && (
                  <label className="flex flex-col gap-2 text-sm text-white/70">
                    Email
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#d2ad55]"
                    />
                  </label>
                )}
                {!isForgot && (
                  <label className="flex flex-col gap-2 text-sm text-white/70">
                    {isReset ? "New password" : "Password"}
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#d2ad55]"
                    />
                  </label>
                )}
                {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                {message && <p role="status" className="text-sm text-[#d2ad55]">{message}</p>}
                <button
                  disabled={loading}
                  className="w-full rounded-full bg-[#970024] px-6 py-3.5 font-semibold transition hover:bg-[#b0002d] disabled:opacity-60"
                >
                  {loading ? "Please wait…" : isSignUp ? "Create account" : isForgot ? "Send reset link" : isReset ? "Update password" : "Log in"}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-6">
                {!isSignUp && !isForgot && !isReset && (
                  <Link href="/auth?mode=forgot" className="text-sm text-[#d2ad55] hover:underline">
                    Forgot your password?
                  </Link>
                )}
                <p className="text-sm text-white/60">
                  {isSignUp ? "Already a member?" : "Need to log in?"}{" "}
                  <Link
                    href={isSignUp || isForgot || isReset ? "/auth" : "/auth?mode=signup"}
                    className="text-[#d2ad55] hover:underline"
                  >
                    {isSignUp || isForgot || isReset ? "Log in" : "Sign up"}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#071520]" />}>
      <AuthForm />
    </Suspense>
  )
}