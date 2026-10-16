"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { formatDate, relativeTime } from "@/lib/dashboard-data"
import { BadgeCheck, History, KeyRound, LogIn, Mail, UserPlus, UserRound } from "lucide-react"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type HistoryEvent = { id: string; icon: typeof History; title: string; description: string; date: string }

const profileStatusLabels: Record<string, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Changes requested",
}

export function HistoryView({ member, data, onNavigate }: DashboardViewProps) {
  const events: HistoryEvent[] = [
    { id: "joined", icon: UserPlus, title: "Joined the DDNI Network", description: "Your member account was created.", date: member.createdAt },
    { id: "confirmed", icon: BadgeCheck, title: "Email verified", description: `${member.email || "Your email"} was confirmed.`, date: member.emailConfirmedAt },
    { id: "signin", icon: LogIn, title: "Last sign-in", description: "Most recent successful sign-in to your account.", date: member.lastSignInAt },
    { id: "profile", icon: UserRound, title: "Profile updated", description: member.profileStatus ? `Professional profile saved · ${profileStatusLabels[member.profileStatus] || member.profileStatus}` : "Professional profile saved.", date: member.lastProfileSavedAt || data.profile.updatedAt },
    { id: "password", icon: KeyRound, title: "Password changed", description: "Your account password was updated.", date: member.passwordChangedAt },
    { id: "email", icon: Mail, title: "Email change requested", description: member.pendingEmail ? `Waiting for confirmation of ${member.pendingEmail}.` : "A change of contact email was requested.", date: member.emailChangeRequestedAt },
  ].filter((event) => event.date && !Number.isNaN(new Date(event.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <ViewHeader kicker="Account history" title="Your journey with DDNI" description="Key activity on your member account, most recent first." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Member since" value={member.memberSince || "—"} />
        <Summary label="Last sign-in" value={member.lastSignInAt ? relativeTime(member.lastSignInAt) : "—"} />
        <Summary label="Profile status" value={member.profileStatus ? profileStatusLabels[member.profileStatus] || member.profileStatus : "Not submitted"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Account events recorded by DDNI.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState icon={History} title="No activity yet" description="Account activity will appear here." />
          ) : (
            <ol className="relative flex flex-col gap-6 border-l border-border pl-6">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute top-0.5 -left-[2.1rem] flex size-7 items-center justify-center rounded-full border border-border bg-card text-[#f3d27a]"><event.icon className="size-3.5" /></span>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                    <time dateTime={event.date} className="shrink-0 text-xs text-muted-foreground" title={new Date(event.date).toLocaleString()}>
                      {formatDate(event.date, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">See something you don&apos;t recognise?</p>
          <p className="text-xs text-muted-foreground">Change your password and sign out of other devices, then let us know.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate("settings")}>Security settings</Button>
          <Button size="sm" className="btn-gold" onClick={() => onNavigate("support")}>Contact support</Button>
        </div>
      </div>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Badge variant="outline" className="w-fit border-[#dcb567]/40 text-sm text-[#f3d27a]">{value}</Badge>
      </CardContent>
    </Card>
  )
}
