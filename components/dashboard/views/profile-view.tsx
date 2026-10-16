"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { stats } from "@/lib/dashboard-data"
import type { DashboardMember } from "@/components/dashboard/dashboard-shell"
import { MemberAvatarContent } from "@/components/dashboard/member-avatar"
import { Check, Globe2, Mail, MapPin, Pencil, Save, ShieldCheck } from "lucide-react"

export function ProfileView({ member }: { member: DashboardMember }) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(member.name)
  const [title, setTitle] = useState(member.title)

  function saveProfile() {
    setEditing(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2400)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d27a]">Member profile</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Your public presence</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Keep your profile current so the right people in the TDD Network can find and connect with you.</p>
        </div>
        <Button onClick={() => (editing ? saveProfile() : setEditing(true))} className="btn-gold shrink-0">
          {editing ? <Save data-icon="inline-start" /> : <Pencil data-icon="inline-start" />}
          {editing ? "Save changes" : "Edit profile"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
            <CardDescription>This information is visible to verified network members.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold" style={{ backgroundColor: member.avatarColor, color: "#1a1200" }}><MemberAvatarContent member={member} imageClassName="rounded-2xl" /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold text-foreground">{name}</h3><Badge variant="outline" className="border-[#c89b3c]/50 text-[#f3d27a]"><ShieldCheck data-icon="inline-start" /> Verified member</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                {member.memberSince && <p className="mt-2 text-xs text-muted-foreground">Member since {member.memberSince}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">Full name<Input value={name} onChange={(event) => setName(event.target.value)} disabled={!editing} /></label>
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">Professional title<Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={!editing} /></label>
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">Email address<div className="relative"><Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={member.email} placeholder="No email on file" disabled className="pl-9" /></div></label>
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">Location<div className="relative"><MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input defaultValue={member.location} placeholder="Add your location" disabled={!editing} className="pl-9" /></div></label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Globe2 className="size-3.5" /> Public network profile</span><span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> LinkedIn connected</span>{saved && <span className="inline-flex items-center gap-1 text-[#f3d27a]"><Check className="size-3.5" /> Saved just now</span>}</div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Profile strength</CardTitle><CardDescription>Complete your profile to improve discovery.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-end justify-between"><span className="text-4xl font-semibold text-[#f3d27a]">{stats.profileCompletion}%</span><span className="text-xs text-muted-foreground">Strong foundation</span></div>
            <Progress value={stats.profileCompletion} className="h-2" />
            <div className="flex flex-col gap-3 text-sm"><div className="flex items-center gap-2 text-foreground"><Check className="size-4 text-[#f3d27a]" /> Professional details</div><div className="flex items-center gap-2 text-foreground"><Check className="size-4 text-[#f3d27a]" /> Areas of expertise</div><div className="flex items-center gap-2 text-muted-foreground"><span className="size-4 rounded-full border border-border" /> Add a personal introduction</div></div>
            <Button variant="outline" className="w-full">Add introduction</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
