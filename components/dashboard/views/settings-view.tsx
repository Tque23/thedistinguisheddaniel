"use client"

import { useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Bell, Check, LockKeyhole, Mail, Shield, Smartphone } from "lucide-react"

function SettingRow({ icon: Icon, title, description, children }: { icon: typeof Bell; title: string; description: string; children: ReactNode }) {
  return <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#970024]/20 text-[#ef7182]"><Icon className="size-4" /></div><div><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">{description}</p></div></div><div className="shrink-0">{children}</div></div>
}

export function SettingsView() {
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [networkAlerts, setNetworkAlerts] = useState(true)
  const [saved, setSaved] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [emailEditing, setEmailEditing] = useState(false)
  const [contactEmail, setContactEmail] = useState("daniel@whitfieldcapital.com")
  const [sessionMessage, setSessionMessage] = useState("")

  function savePreferences() { setSaved(true); window.setTimeout(() => setSaved(false), 2400) }

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d27a]">Account settings</p><h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Your account, your way</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Manage security, communication preferences, and the way you experience the TDD Network.</p></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(250px,0.8fr)]">
      <div className="flex flex-col gap-6">
        <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choose what deserves your attention.</CardDescription></CardHeader><CardContent className="divide-y divide-border"><SettingRow icon={Mail} title="Email updates" description="Receive weekly insights, learning reminders, and member news."><button type="button" aria-pressed={emailUpdates} onClick={() => setEmailUpdates(!emailUpdates)} className={`relative h-6 w-11 rounded-full transition-colors ${emailUpdates ? "bg-[#970024]" : "bg-muted"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${emailUpdates ? "left-6" : "left-1"}`} /></button></SettingRow><SettingRow icon={Bell} title="Network activity" description="Get notified when someone responds to your opportunity or connection request."><button type="button" aria-pressed={networkAlerts} onClick={() => setNetworkAlerts(!networkAlerts)} className={`relative h-6 w-11 rounded-full transition-colors ${networkAlerts ? "bg-[#970024]" : "bg-muted"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${networkAlerts ? "left-6" : "left-1"}`} /></button></SettingRow></CardContent></Card>
        <Card><CardHeader><CardTitle>Security</CardTitle><CardDescription>Keep your member account protected.</CardDescription></CardHeader><CardContent><SettingRow icon={LockKeyhole} title="Password" description="Last changed 4 months ago. Use a strong, unique password."><Button variant="outline" size="sm" onClick={() => setPasswordOpen(!passwordOpen)}>{passwordOpen ? "Cancel" : "Change password"}</Button></SettingRow>{passwordOpen && <div className="flex flex-col gap-2 border-t border-border pt-4"><label htmlFor="new-password" className="text-xs font-medium text-foreground">New password</label><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><Button size="sm" className="self-start" onClick={() => { setPasswordOpen(false); setPassword(""); setSessionMessage("Password change requested") }}>Update password</Button></div>}<Separator /><SettingRow icon={Smartphone} title="Two-factor authentication" description="Add another layer of protection when signing in."><Button variant="outline" size="sm" onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}>{twoFactorEnabled ? "Enabled" : "Enable 2FA"}</Button></SettingRow></CardContent></Card>
      </div>
      <div className="flex flex-col gap-6"><Card><CardHeader><CardTitle>Contact email</CardTitle><CardDescription>Used for account access and important notices.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><div className="relative"><Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} readOnly={!emailEditing} /></div><p className="text-xs text-muted-foreground">Your email is verified and never shown publicly.</p><Button variant="outline" className="w-full" onClick={() => { setEmailEditing(!emailEditing); setSessionMessage(emailEditing ? "Contact email saved" : "Contact email is ready to edit") }}>{emailEditing ? "Save email" : "Update email"}</Button></CardContent></Card><Card><CardHeader><CardTitle>Sessions</CardTitle><CardDescription>Devices currently signed in.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex items-start gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-muted"><Shield className="size-4 text-[#f3d27a]" /></div><div className="min-w-0"><p className="text-sm font-medium text-foreground">Chrome on macOS</p><p className="text-xs text-muted-foreground">Atlanta, GA · Active now</p></div><Badge className="ml-auto bg-[#970024] text-[10px]">Current</Badge></div><Button variant="ghost" className="justify-start px-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => setSessionMessage("Other sessions signed out")}>Sign out of all other sessions</Button>{sessionMessage && <p className="text-xs text-[#f3d27a]" role="status">{sessionMessage}</p>}</CardContent></Card><Button onClick={savePreferences} className="btn-gold w-full">{saved ? <><Check data-icon="inline-start" /> Saved</> : "Save preferences"}</Button></div>
    </div>
  </div>
}
