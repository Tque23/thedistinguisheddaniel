"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CourseInfo } from "@/components/course-info"
import { AuthFeedbackDialog } from "@/components/auth/auth-feedback-dialog"
import { requestAuth } from "@/lib/auth-client"
import { AlertCircle, CheckCircle2 } from "lucide-react"

const SENSITIVE_PARAMS = [
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "id_token",
  "state",
  "error_description",
  "error_code",
]
const SENSITIVE_PARAM_SET = new Set(SENSITIVE_PARAMS)

function safeNextPath(requestedNext: string | null) {
  if (!requestedNext || !requestedNext.startsWith("/") || requestedNext.startsWith("//") || requestedNext.includes("\\")) {
    return null
  }
  try {
    const destination = new URL(requestedNext, "https://distinguisheddaniel.com")
    if (destination.origin !== "https://distinguisheddaniel.com") return null
    for (const param of SENSITIVE_PARAMS) destination.searchParams.delete(param)
    destination.hash = ""
    return `${destination.pathname}${destination.search}`
  } catch {
    return null
  }
}

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const isSignUp = mode === "signup"
  const isReset = mode === "reset"
  const isForgot = mode === "forgot"
  const timedOut = searchParams.get("timeout") === "1"
  const confirmed = searchParams.get("confirmed") === "1"
  const queryError = searchParams.get("error") ?? ""
  const expiredLink = queryError === "link_expired" || (
    /(?:invalid|expired|already used|has been used)/i.test(queryError)
    && /(?:link|token|otp|confirmation)/i.test(queryError)
  )
  const genericAuthError = queryError === "auth_failed" || Boolean(queryError && !expiredLink)
  const [email, setEmail] = useState("")
  const [signupSentEmail, setSignupSentEmail] = useState("")
  const [showResendForm, setShowResendForm] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [resendError, setResendError] = useState("")

  useEffect(() => {
    const url = new URL(window.location.href)
    let changed = false
    for (const param of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_PARAM_SET.has(param.toLowerCase())) {
        url.searchParams.delete(param)
        changed = true
      }
    }
    if (url.hash) {
      url.hash = ""
      changed = true
    }
    if (queryError && queryError !== "link_expired" && queryError !== "auth_failed") {
      url.searchParams.set("error", expiredLink ? "link_expired" : "auth_failed")
      changed = true
    }
    if (changed) {
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`)
    }
  }, [expiredLink, queryError])
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const loadingStartedAt = Date.now()
    const finishLoading = async () => {
      const remaining = Math.max(0, 1200 - (Date.now() - loadingStartedAt))
      if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining))
      setLoading(false)
    }
    setLoading(true)
    setError("")
    setMessage("")
    if (isReset) {
      const result = await requestAuth({ action: "update_password", password })
      if (!result.ok) {
        setError(result.error)
      } else {
        setMessage(result.message || "Your password has been updated. You can now log in.")
        setPassword("")
      }
      await finishLoading()
      return
    }

    if (isForgot) {
      const result = await requestAuth({ action: "request_password_reset", email })
      if (!result.ok) {
        setError(result.error)
      } else {
        setMessage(result.message || "If an account exists for that email, you'll receive a password reset link shortly.")
      }
      await finishLoading()
      return
    }

    const result = isSignUp
      ? await requestAuth({ action: "sign_up", email, password, name })
      : await requestAuth({ action: "sign_in", email, password })

    if (!result.ok) {
      setError(result.error)
    } else if (isSignUp) {
      setSignupSentEmail(email.trim())
    } else {
      const destination = safeNextPath(searchParams.get("next"))
        || (email.trim().toLowerCase() === "admin@distinguisheddaniel.com" ? "/admin" : "/dashboard")
      router.push(destination)
      router.refresh()
    }
    await finishLoading()
  }

  async function resendSignupLink(targetEmail: string) {
    setResending(true)
    setResendMessage("")
    setResendError("")
    const result = await requestAuth({ action: "resend_signup", email: targetEmail.trim() })
    if (result.ok) {
      setResendMessage(result.message || "New link sent! Check your inbox.")
    } else {
      setResendError(result.error)
    }
    setResending(false)
  }

  if (confirmed) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#071520] px-6 py-12 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: "linear-gradient(rgba(216,184,101,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(216,184,101,.12) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
        <div className="relative w-full max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b865]">Welcome to DDNI</p>
          <div className="mx-auto my-8 grid size-16 place-items-center rounded-full border border-[#d8b865]/50 text-2xl text-[#d8b865]" aria-hidden="true">✓</div>
          <h1 className="font-display text-4xl leading-tight sm:text-6xl">Thank you for<br /><span className="text-[#d8b865]">signing up.</span></h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-white/65 sm:text-lg">Your account has been confirmed. We&apos;re glad to have you with us and look forward to sharing what&apos;s next.</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="rounded-full bg-[#d8b865] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#071520] transition hover:bg-[#f3d27a]">Return home</Link>
            <Link href="/auth" className="rounded-full border border-white/25 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[#d8b865] hover:text-[#d8b865]">Log in</Link>
          </div>
        </div>
      </main>
    )
  }

  if (expiredLink) {
    return (
      <AuthFeedbackDialog
        eyebrow="Link unavailable"
        title="Link Expired"
        description="This magic or signup link has expired or was already used. Request a new link to continue."
        icon={AlertCircle}
      >
        {resendMessage && <p role="status" className="mt-4 text-sm text-[#dcb567]">{resendMessage}</p>}
        {resendError && <p role="alert" className="mt-4 text-sm text-red-300">We couldn&apos;t send a new link. {resendError}</p>}
        {showResendForm ? (
          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              void resendSignupLink(email)
            }}
          >
            <label htmlFor="resend-email" className="text-left text-sm text-white/70">Email address</label>
            <input
              id="resend-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#dcb567]"
            />
            <button
              type="submit"
              disabled={resending}
              className="inline-flex justify-center rounded-full bg-[#dcb567] px-5 py-3 text-sm font-semibold text-[#1a1200] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend Signup Link"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowResendForm(true)}
            className="mt-6 inline-flex rounded-full bg-[#dcb567] px-5 py-3 text-sm font-semibold text-[#1a1200] transition hover:opacity-90"
          >
            Request New Link
          </button>
        )}
        <Link href="/auth" className="mt-5 block text-sm text-white/65 transition hover:text-[#dcb567]">
          Back to Sign In
        </Link>
      </AuthFeedbackDialog>
    )
  }

  if (signupSentEmail) {
    return (
      <AuthFeedbackDialog
        eyebrow="Signup confirmation"
        title="Check Your Email"
        description={`We've sent a confirmation link to ${signupSentEmail}. Please check your inbox (and spam folder) to activate your account.`}
        icon={CheckCircle2}
      >
        {resendMessage && <p role="status" className="mt-4 text-sm text-[#dcb567]">{resendMessage}</p>}
        {resendError && <p role="alert" className="mt-4 text-sm text-red-300">We couldn&apos;t send another link. {resendError}</p>}
        <Link
          href="/auth"
          className="mt-6 inline-flex rounded-full bg-[#dcb567] px-5 py-3 text-sm font-semibold text-[#1a1200] transition hover:opacity-90"
        >
          Back to Sign In
        </Link>
        <button
          type="button"
          disabled={resending}
          onClick={() => void resendSignupLink(signupSentEmail)}
          className="mt-5 block w-full text-sm text-white/65 transition hover:text-[#dcb567] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Sending a new link…" : "Didn't receive email? Resend"}
        </button>
      </AuthFeedbackDialog>
    )
  }

  return (
    <>
      {loading && <div className="fixed inset-0 z-[210] grid place-items-center bg-[#071520]/95 text-white backdrop-blur-sm" role="status" aria-live="polite"><div className="flex flex-col items-center gap-4"><div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-[#d8b865]" /><span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b865]">{isSignUp ? "Creating account" : "Signing in"}</span></div></div>}
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
          {timedOut && !isSignUp && !isForgot && !isReset && (
            <p role="status" className="mt-5 max-w-lg rounded-xl border border-[#d2ad55]/30 bg-[#d2ad55]/10 px-4 py-3 text-sm text-[#f3d27a]">
              Your dashboard session expired after 5 minutes of inactivity. Please log in again.
            </p>
          )}
          {genericAuthError && (
            <p role="alert" className="mt-5 max-w-lg rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-200">
              Authentication could not be completed. Please sign in or request a new link.
            </p>
          )}
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
                  <a className="text-[#d2ad55] underline" href="mailto:info@distinguisheddaniel.com">
                    info@distinguisheddaniel.com / +27 83 250 6306
                  </a>
                  .
                </p>
                <dl className="mt-4 grid gap-1 text-white/80">
                  <div className="flex justify-between gap-4">
                    <dt>Account Holder</dt>
                    <dd className="text-right">LAWYAL SOLUTIONS PTY LTD</dd>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <dt>Bank</dt>
                    <dd className="text-right flex flex-col">
                      <span>Bank: STANDARD BANK</span>
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
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#071520]" />}>
      <AuthForm />
    </Suspense>
  )
}
