"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, StatusMessage, Switch, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { EMAIL_PATTERN, relativeTime } from "@/lib/dashboard-data"
import { Bell, LockKeyhole, LogOut, Mail, MonitorSmartphone } from "lucide-react"
import type { DashboardMember, DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type Status = { tone: "success" | "error"; text: string } | null

function SettingRow({ icon: Icon, title, description, children }: { icon: typeof Bell; title: string; description: string; children: ReactNode }) {
  return <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#970024]/20 text-[#ef7182]"><Icon className="size-4" /></div><div><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">{description}</p></div></div><div className="shrink-0">{children}</div></div>
}

export function SettingsView({ member, onMemberChange, onNavigate }: DashboardViewProps & { onMemberChange: (updates: Partial<DashboardMember>) => void }) {
  const router = useRouter()

  const [preferences, setPreferences] = useState(member.preferences)
  const [preferencesStatus, setPreferencesStatus] = useState<Status>(null)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const preferencesDirty = preferences.emailUpdates !== member.preferences.emailUpdates || preferences.networkAlerts !== member.preferences.networkAlerts

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [password, setPassword] = useState({ next: "", confirm: "" })
  const [passwordErrors, setPasswordErrors] = useState<{ next?: string; confirm?: string }>({})
  const [passwordStatus, setPasswordStatus] = useState<Status>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [email, setEmail] = useState(member.pendingEmail || member.email)
  const [emailError, setEmailError] = useState("")
  const [emailStatus, setEmailStatus] = useState<Status>(member.pendingEmail ? { tone: "success", text: `Waiting for you to confirm ${member.pendingEmail}. Check both inboxes.` } : null)
  const [savingEmail, setSavingEmail] = useState(false)

  const [sessionStatus, setSessionStatus] = useState<Status>(null)
  const [signingOut, setSigningOut] = useState<"others" | "global" | null>(null)

  async function savePreferences() {
    setSavingPreferences(true)
    setPreferencesStatus(null)
    const { error } = await createClient().auth.updateUser({ data: { preferences: { email_updates: preferences.emailUpdates, network_alerts: preferences.networkAlerts } } })
    setSavingPreferences(false)
    if (error) return setPreferencesStatus({ tone: "error", text: "We couldn't save your preferences. Please try again." })
    onMemberChange({ preferences })
    setPreferencesStatus({ tone: "success", text: "Preferences saved." })
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    const errors: typeof passwordErrors = {}
    if (password.next.length < 8) errors.next = "Use at least 8 characters."
    else if (!/[A-Za-z]/.test(password.next) || !/\d/.test(password.next)) errors.next = "Include at least one letter and one number."
    if (password.confirm !== password.next) errors.confirm = "Passwords don't match."
    setPasswordErrors(errors)
    if (Object.keys(errors).length) return
    setSavingPassword(true)
    setPasswordStatus(null)
    const now = new Date().toISOString()
    const { error } = await createClient().auth.updateUser({ password: password.next, data: { password_changed_at: now } })
    setSavingPassword(false)
    if (error) {
      const message = /reauth|recent/i.test(error.message) ? "For security, please sign out and back in, then try again." : /different|same/i.test(error.message) ? "Choose a password you haven't used for this account." : "We couldn't update your password. Please try again."
      return setPasswordStatus({ tone: "error", text: message })
    }
    onMemberChange({ passwordChangedAt: now })
    setPassword({ next: "", confirm: "" })
    setPasswordOpen(false)
    setPasswordStatus({ tone: "success", text: "Your password has been updated." })
  }

  async function changeEmail(event: FormEvent) {
    event.preventDefault()
    const next = email.trim().toLowerCase()
    setEmailStatus(null)
    if (!EMAIL_PATTERN.test(next) || next.length > 254) return setEmailError("Enter a valid email address.")
    if (next === member.email.toLowerCase()) return setEmailError("This is already your contact email.")
    setEmailError("")
    setSavingEmail(true)
    const now = new Date().toISOString()
    const { error } = await createClient().auth.updateUser(
      { email: next, data: { email_change_requested_at: now } },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard?view=settings")}` },
    )
    setSavingEmail(false)
    if (error) return setEmailStatus({ tone: "error", text: /already|registered|exists/i.test(error.message) ? "That email is already used by another account." : "We couldn't start the email change. Please try again." })
    onMemberChange({ pendingEmail: next, emailChangeRequestedAt: now })
    setEmailStatus({ tone: "success", text: `Confirmation sent. Follow the link sent to ${next} (and your current inbox, if asked) to finish.` })
  }

  async function signOut(scope: "others" | "global") {
    setSigningOut(scope)
    setSessionStatus(null)
    const { error } = await createClient().auth.signOut({ scope })
    setSigningOut(null)
    if (error) return setSessionStatus({ tone: "error", text: "We couldn't sign out those sessions. Please try again." })
    if (scope === "global") {
      router.replace("/auth")
      router.refresh()
      return
    }
    setSessionStatus({ tone: "success", text: "You've been signed out on all other devices." })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ViewHeader kicker="Account settings" title="Your account, your way" description="Manage security, communication preferences, and the way you experience the TDD Network." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Communication</CardTitle><CardDescription>Choose what deserves your attention.</CardDescription></CardHeader>
            <CardContent className="flex flex-col">
              <div className="divide-y divide-border">
                <SettingRow icon={Mail} title="Email updates" description="Institute news, course announcements and member updates.">
                  <Switch label="Email updates" checked={preferences.emailUpdates} onChange={(value) => { setPreferences({ ...preferences, emailUpdates: value }); setPreferencesStatus(null) }} />
                </SettingRow>
                <SettingRow icon={Bell} title="Network activity" description="Emails about new opportunities and responses in the Network.">
                  <Switch label="Network activity" checked={preferences.networkAlerts} onChange={(value) => { setPreferences({ ...preferences, networkAlerts: value }); setPreferencesStatus(null) }} />
                </SettingRow>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <Button className="btn-gold" disabled={!preferencesDirty || savingPreferences} onClick={() => void savePreferences()}>{savingPreferences ? "Saving…" : "Save preferences"}</Button>
                {preferencesStatus && <StatusMessage tone={preferencesStatus.tone}>{preferencesStatus.text}</StatusMessage>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Security</CardTitle><CardDescription>Keep your member account protected.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <SettingRow icon={LockKeyhole} title="Password" description={member.passwordChangedAt ? `Last changed ${relativeTime(member.passwordChangedAt)}.` : "Use a strong password you don't use anywhere else."}>
                <Button variant="outline" size="sm" aria-expanded={passwordOpen} onClick={() => { setPasswordOpen(!passwordOpen); setPasswordErrors({}); setPasswordStatus(null) }}>{passwordOpen ? "Cancel" : "Change password"}</Button>
              </SettingRow>
              {passwordOpen && (
                <form onSubmit={changePassword} noValidate className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  <Field id="new-password" label="New password" error={passwordErrors.next} hint="At least 8 characters, with a letter and a number.">
                    <Input id="new-password" type="password" autoComplete="new-password" value={password.next} aria-invalid={Boolean(passwordErrors.next)} onChange={(e) => setPassword({ ...password, next: e.target.value })} />
                  </Field>
                  <Field id="confirm-password" label="Confirm new password" error={passwordErrors.confirm}>
                    <Input id="confirm-password" type="password" autoComplete="new-password" value={password.confirm} aria-invalid={Boolean(passwordErrors.confirm)} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
                  </Field>
                  <Button type="submit" size="sm" className="btn-gold w-fit sm:col-span-2" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"}</Button>
                </form>
              )}
              {passwordStatus && <StatusMessage tone={passwordStatus.tone}>{passwordStatus.text}</StatusMessage>}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Contact email</CardTitle><CardDescription>Used for sign-in and important notices. Never shown publicly.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={changeEmail} noValidate className="flex flex-col gap-3">
                <Field id="contact-email" label="Email address" error={emailError}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="contact-email" type="email" autoComplete="email" className="pl-9" value={email} aria-invalid={Boolean(emailError)} onChange={(e) => { setEmail(e.target.value); setEmailError(""); setEmailStatus(null) }} />
                  </div>
                </Field>
                <Button type="submit" variant="outline" className="w-full" disabled={savingEmail || email.trim().toLowerCase() === member.email.toLowerCase()}>{savingEmail ? "Sending confirmation…" : "Update email"}</Button>
                {emailStatus && <StatusMessage tone={emailStatus.tone}>{emailStatus.text}</StatusMessage>}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sessions</CardTitle><CardDescription>Manage where you're signed in.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><MonitorSmartphone className="size-4 text-[#f3d27a]" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">This device</p>
                  <p className="text-xs text-muted-foreground">{member.lastSignInAt ? `Signed in ${relativeTime(member.lastSignInAt)}` : "Active now"}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" disabled={signingOut !== null} onClick={() => void signOut("others")}><LogOut data-icon="inline-start" />{signingOut === "others" ? "Signing out…" : "Sign out of other devices"}</Button>
                <Button variant="destructive" size="sm" disabled={signingOut !== null} onClick={() => void signOut("global")}>{signingOut === "global" ? "Signing out…" : "Sign out everywhere"}</Button>
              </div>
              {sessionStatus && <StatusMessage tone={sessionStatus.tone}>{sessionStatus.text}</StatusMessage>}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Need to close your account?</p>
              <p className="text-xs text-muted-foreground">Our team will help you export or remove your information.</p>
              <Button variant="link" size="sm" className="h-auto w-fit px-0 text-xs" onClick={() => onNavigate("support")}>Contact support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
