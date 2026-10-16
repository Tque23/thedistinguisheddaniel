"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, StatusMessage, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { SUPPORT_EMAIL, initialsFor, isValidUrl, profileCompletion, relativeTime, type DirectoryMember, type Opportunity } from "@/lib/dashboard-data"
import { Briefcase, Building2, ExternalLink, Handshake, Mail, MapPin, Search, Users2 } from "lucide-react"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const [expanded, setExpanded] = useState(false)
  const long = opportunity.description.length > 220
  return (
    <Card className="dashboard-card-hover">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#dcb567]/10 text-[#f3d27a]"><Handshake className="size-4" /></div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm leading-snug font-medium text-foreground">{opportunity.title}</span>
            <span className="text-xs text-muted-foreground">DDNI Administration · {relativeTime(opportunity.createdAt)}</span>
          </div>
        </div>
        {opportunity.description && <p className={`text-sm whitespace-pre-line text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}>{opportunity.description}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {long ? <Button variant="link" size="sm" className="h-7 px-0 text-xs" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? "Show less" : "Read more"}</Button> : <span />}
          <Button size="sm" variant="outline" className="h-7 text-xs" render={<a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Opportunity response: ${opportunity.title}`)}`} />}>
            <Mail data-icon="inline-start" />Respond
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DirectoryCard({ person }: { person: DirectoryMember }) {
  const link = isValidUrl(person.linkedinUrl) ? person.linkedinUrl : isValidUrl(person.website) ? person.website : ""
  return (
    <Card className="dashboard-card-hover">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#132c40] text-xs font-semibold text-[#f3d27a]">{initialsFor(person.name)}</div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{person.name}</span>
            <span className="truncate text-xs text-muted-foreground">{[person.role, person.company].filter(Boolean).join(", ") || person.headline || "DDNI member"}</span>
          </div>
        </div>
        {person.headline && <p className="line-clamp-2 text-xs text-muted-foreground">{person.headline}</p>}
        {person.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{person.skills.slice(0, 3).map((skill) => <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>)}</div>}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">{person.location && <><MapPin className="size-3 shrink-0" />{person.location}</>}</span>
          {link && <Button size="sm" variant="ghost" className="h-7 shrink-0 text-xs" render={<a href={link} target="_blank" rel="noopener noreferrer" />}><ExternalLink data-icon="inline-start" />Connect</Button>}
        </div>
      </CardContent>
    </Card>
  )
}

export function NetworkView({ member, data, onNavigate }: DashboardViewProps) {
  const [opportunityQuery, setOpportunityQuery] = useState("")
  const [memberQuery, setMemberQuery] = useState("")
  const completion = profileCompletion(member, data.profile)

  const opportunities = data.opportunities.filter((op) => {
    const q = opportunityQuery.trim().toLowerCase()
    return !q || op.title.toLowerCase().includes(q) || op.description.toLowerCase().includes(q)
  })
  const directory = data.directory.filter((person) => {
    const q = memberQuery.trim().toLowerCase()
    return !q || [person.name, person.company, person.role, person.headline, person.location, ...person.skills].some((v) => v.toLowerCase().includes(q))
  })

  return (
    <div className="flex flex-col gap-8">
      <ViewHeader kicker="The Network" title="Kingdom pioneers, connected" description="Opportunities shared by the DDNI team and members who have published their profiles." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 lg:col-span-2" aria-labelledby="opportunity-board">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 id="opportunity-board" className="text-base font-semibold text-foreground">Opportunity board</h3>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={opportunityQuery} onChange={(e) => setOpportunityQuery(e.target.value)} placeholder="Search opportunities" aria-label="Search opportunities" className="h-8 pl-8 text-sm" />
            </div>
          </div>
          {data.errors.opportunities && <StatusMessage tone="error">{data.errors.opportunities}</StatusMessage>}
          {data.loading ? [0, 1].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />) : opportunities.length === 0 ? (
            <EmptyState icon={Briefcase} title={data.opportunities.length ? "No opportunities match your search" : "No opportunities yet"} description={data.opportunities.length ? "Try a different search." : "Opportunities published by the DDNI team will appear here."} />
          ) : opportunities.map((op) => <OpportunityCard key={op.id} opportunity={op} />)}
        </section>

        <Card className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4 text-[#f3d27a]" />Your network profile</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{data.profile.company || member.name}</span>
              <span className="text-xs text-muted-foreground">{data.profile.headline || "Add a headline so members know what you do."}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Profile completion</span><span className="font-medium text-foreground">{completion.percent}%</span></div>
              <Progress value={completion.percent} className="h-1.5" />
              {completion.missing.length > 0 && <span className="text-xs text-muted-foreground">Missing: {completion.missing.join(", ")}</span>}
            </div>
            <Button size="sm" className="btn-gold w-full" onClick={() => onNavigate("profile")}>Edit profile</Button>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="member-directory">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 id="member-directory" className="text-base font-semibold text-foreground">Member directory</h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Search by name, company or expertise" aria-label="Search members" className="h-8 pl-8 text-sm" />
          </div>
        </div>
        {data.errors.directory && <StatusMessage tone="error">{data.errors.directory}</StatusMessage>}
        {data.loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : directory.length === 0 ? (
          <EmptyState icon={Users2} title={data.directory.length ? "No members match your search" : "The directory is growing"} description={data.directory.length ? "Try a different name, company or expertise." : "Member profiles will appear here as members publish them."} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{directory.map((person) => <DirectoryCard key={person.id} person={person} />)}</div>
        )}
      </section>
    </div>
  )
}
