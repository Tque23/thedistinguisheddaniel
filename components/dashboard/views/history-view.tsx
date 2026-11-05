"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/dashboard/dashboard-ui"
import { formatDate, relativeTime } from "@/lib/dashboard-data"
import { BadgeCheck, History, KeyRound, LogIn, Mail, UserPlus, UserRound } from "lucide-react"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type HistoryEvent = { id: string; icon: typeof History; title: string; description: string; date: string }

const profileStatusLabels: Record<string, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Changes requested",
}

export function AccountHistory({ member, data, onNavigate }: Pick<DashboardViewProps, "member" | "data" | "onNavigate">) {
  const events: HistoryEvent[] = [
    { id: "joined", icon: UserPlus, title: "Joined the DDNI Network", description: "Your member account was created.", date: member.createdAt },
    { id: "confirmed", icon: BadgeCheck, title: "Email verified", description: `${member.email || "Your email"} was confirmed.`, date: member.emailConfirmedAt },
    { id: "signin", icon: LogIn, title: "Last sign-in", description: "Most recent successful sign-in to your account.", date: member.lastSignInAt },
    { id: "profile", icon: UserRound, title: "Profile updated", description: member.profileStatus ? `Professional profile saved · ${profileStatusLabels[member.profileStatus] || member.profileStatus}` : "Professional profile saved.", date: member.lastProfileSavedAt || data.profile.updatedAt },
    { id: "review", icon: BadgeCheck, title: member.profileStatus === "approved" ? "Profile approved" : member.profileStatus === "rejected" ? "Profile changes requested" : "Profile reviewed", description: member.profileReviewNote || (member.profileStatus === "approved" ? "Your professional profile was approved by the DDNI team." : "The DDNI team reviewed your professional profile."), date: member.profileReviewedAt },
    { id: "password", icon: KeyRound, title: "Password changed", description: "Your account password was updated.", date: member.passwordChangedAt },
    { id: "email", icon: Mail, title: "Email change requested", description: member.pendingEmail ? `Waiting for confirmation of ${member.pendingEmail}.` : "A change of contact email was requested.", date: member.emailChangeRequestedAt },
  ].filter((event) => event.date && !Number.isNaN(new Date(event.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-col gap-6">
      <div className="grid min-w-0 gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:grid-cols-3">
        <Summary label="Member since" value={member.memberSince || "—"} icon={UserPlus} />
        <Summary label="Last sign-in" value={member.lastSignInAt ? relativeTime(member.lastSignInAt) : "—"} icon={LogIn} />
        <Summary label="Email verification" value={member.emailConfirmedAt ? "Verified" : "Not verified"} icon={BadgeCheck} />
      </div>

      <Card className="min-w-0 gap-6 border border-border/60 bg-card p-6 shadow-sm">
        <CardHeader className="flex flex-col gap-1 border-b border-border/60 p-0 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">Account activity</CardTitle>
            <CardDescription className="leading-relaxed">A dated record of important events on your member account.</CardDescription>
          </div>
          <p className="text-xs font-medium tabular-nums text-muted-foreground">{events.length} {events.length === 1 ? "event" : "events"}</p>
        </CardHeader>
        <CardContent className="min-w-0 p-0 pt-5">
          {events.length === 0 ? (
            <EmptyState icon={History} title="No activity yet" description="Account activity will appear here." />
          ) : (
            <ol className="relative flex flex-col">
              {events.map((event) => (
                <li key={event.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 border-b border-border/60 py-4 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-x-4">
                  <span className="relative z-10 grid size-9 place-items-center rounded-xl bg-muted/70 text-primary ring-1 ring-border/60">
                    <event.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  </div>
                  <time dateTime={event.date} className="col-start-2 mt-1 text-xs tabular-nums text-muted-foreground sm:col-start-3 sm:row-start-1 sm:mt-0 sm:whitespace-nowrap sm:pt-1" title={new Date(event.date).toLocaleString()}>
                    {formatDate(event.date, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="account-security-notice" className="flex min-w-0 flex-col items-start gap-6 rounded-xl border border-border/60 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary ring-1 ring-border/60"><BadgeCheck className="size-5" aria-hidden="true" /></span>
          <div>
            <h3 id="account-security-notice" className="text-base font-semibold leading-snug tracking-tight text-foreground">See something you don&apos;t recognise?</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Change your password and sign out of other devices, then let us know.</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" className="min-h-11 px-4" onClick={() => onNavigate("settings")}>Security settings</Button>
          <Button className="btn-gold min-h-11 px-4" onClick={() => onNavigate("support")}>Contact support</Button>
        </div>
      </section>
    </div>
  )
}

function Summary({ label, value, icon: Icon }: { label: string; value: string; icon: typeof History }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 sm:px-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary"><Icon className="size-4" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
