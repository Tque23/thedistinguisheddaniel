"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/dashboard/dashboard-ui"
import { formatDate, profileCompletion, relativeTime } from "@/lib/dashboard-data"
import { ArrowRight, BookOpen, Briefcase, CheckCircle2, Circle, FileText, GraduationCap, UserRound } from "lucide-react"
import type { DashboardView, DashboardViewProps } from "@/components/dashboard/dashboard-shell"

export function OverviewView({ member, data, onNavigate }: DashboardViewProps) {
  const completion = profileCompletion(member, data.profile)
  const nextSteps: { label: string; done: boolean; view: DashboardView }[] = [
    { label: "Complete your professional profile", done: completion.percent === 100, view: "profile" },
    { label: "Explore the Institute course catalogue", done: false, view: "institute" },
    { label: "Browse opportunities in the Network", done: false, view: "network" },
    { label: "Review your communication preferences", done: false, view: "settings" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0c1e2c] via-[#0c1e2c] to-[#132c40] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4">
          <Badge variant="outline" className="w-fit border-[#dcb567]/40 text-[#f3d27a]">
            {member.tier} Member{member.memberSince ? ` since ${member.memberSince}` : ""}
          </Badge>
          <h2 className="font-display text-2xl leading-tight text-foreground sm:text-4xl">
            Welcome back, <span className="text-gold">{member.name.split(" ")[0]}</span>
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {data.loading
              ? "Gathering the latest from the Institute and the Network…"
              : `${data.courses.length} ${data.courses.length === 1 ? "course" : "courses"} and ${data.resources.length} ${data.resources.length === 1 ? "resource" : "resources"} in the Institute, and ${data.opportunities.length} ${data.opportunities.length === 1 ? "opportunity" : "opportunities"} in the Network.`}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button className="btn-gold rounded-full px-4" onClick={() => onNavigate("institute")}>
              Explore the Institute <ArrowRight data-icon="inline-end" />
            </Button>
            {completion.percent < 100 && (
              <Button variant="outline" className="rounded-full px-4" onClick={() => onNavigate("profile")}>
                Complete your profile
              </Button>
            )}
          </div>
        </div>
        <div aria-hidden className="absolute -top-12 -right-12 size-56 rounded-full bg-[#dcb567]/10 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Institute courses" value={data.courses.length} loading={data.loading} onClick={() => onNavigate("institute")} />
        <StatCard icon={FileText} label="Resources available" value={data.resources.length} loading={data.loading} onClick={() => onNavigate("institute")} />
        <StatCard icon={Briefcase} label="Open opportunities" value={data.opportunities.length} loading={data.loading} onClick={() => onNavigate("network")} />
        <StatCard icon={UserRound} label="Profile complete" value={`${completion.percent}%`} loading={data.loading} onClick={() => onNavigate("profile")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader icon={GraduationCap} title="From the Institute" action={<ViewAll onClick={() => onNavigate("institute")} />} />
          <CardContent className="flex flex-col gap-3">
            {data.loading ? <ListSkeleton /> : data.courses.length === 0 ? (
              <EmptyState icon={GraduationCap} title="New courses are on the way" description="Courses published by the Institute will appear here." />
            ) : data.courses.slice(0, 3).map((course) => (
              <button key={course.id} type="button" onClick={() => onNavigate("institute")} className="flex items-center gap-4 rounded-xl border border-border p-3 text-left transition-colors hover:border-[#dcb567]/40 hover:bg-accent/40">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#132c40] to-[#0c1e2c]">
                  {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-[#f3d27a]/70"><BookOpen className="size-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{[course.instructor, course.eventDate ? formatDate(course.eventDate) : course.category].filter(Boolean).join(" · ")}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Briefcase} title="Latest opportunities" action={<ViewAll onClick={() => onNavigate("network")} />} />
          <CardContent className="flex flex-col gap-4">
            {data.loading ? <ListSkeleton /> : data.opportunities.length === 0 ? (
              <EmptyState icon={Briefcase} title="No opportunities yet" description="Opportunities shared by the DDNI team will appear here." />
            ) : data.opportunities.slice(0, 3).map((op) => (
              <button key={op.id} type="button" onClick={() => onNavigate("network")} className="flex flex-col gap-1 border-b border-border pb-3 text-left last:border-0 last:pb-0 hover:text-[#f3d27a]">
                <span className="text-sm leading-snug font-medium text-foreground">{op.title}</span>
                <span className="text-xs text-muted-foreground">DDNI Administration · {relativeTime(op.createdAt)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader icon={CheckCircle2} title="Your next steps" />
          <CardContent className="flex flex-col gap-1">
            {nextSteps.map((step) => (
              <button key={step.label} type="button" onClick={() => onNavigate(step.view)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-accent/40">
                {step.done ? <CheckCircle2 className="size-4 shrink-0 text-[#f3d27a]" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
                <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>{step.label}</span>
                <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <SectionHeader icon={UserRound} title="Profile strength" />
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-end justify-between"><span className="text-3xl font-semibold text-[#f3d27a]">{completion.percent}%</span><span className="text-xs text-muted-foreground">{completion.missing.length === 0 ? "Complete" : `${completion.missing.length} to go`}</span></div>
            <Progress value={completion.percent} className="h-1.5" />
            {completion.missing.length > 0 && <p className="text-xs text-muted-foreground">Next: {completion.missing.slice(0, 3).join(", ")}</p>}
            <Button variant="outline" size="sm" className="mt-1" onClick={() => onNavigate("profile")}>Update profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, action }: { icon: typeof BookOpen; title: string; action?: ReactNode }) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-2">
      <CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4 text-[#f3d27a]" />{title}</CardTitle>
      {action}
    </CardHeader>
  )
}

function ViewAll({ onClick }: { onClick: () => void }) {
  return <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onClick}>View all <ArrowRight data-icon="inline-end" /></Button>
}

function ListSkeleton() {
  return <>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</>
}

function StatCard({ icon: Icon, label, value, loading, onClick }: { icon: typeof BookOpen; label: string; value: number | string; loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="dashboard-card-hover rounded-xl border border-border bg-card text-left">
      <div className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#dcb567]/10 text-[#f3d27a]"><Icon className="size-4.5" /></div>
        <div className="flex flex-col">
          {loading ? <Skeleton className="h-7 w-10" /> : <span className="text-xl font-semibold text-foreground">{value}</span>}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </button>
  )
}
