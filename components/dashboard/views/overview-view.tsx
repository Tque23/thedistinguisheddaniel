"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/dashboard/dashboard-ui"
import { enrollmentFor, formatDate, profileCompletion, relativeTime } from "@/lib/dashboard-data"
import { ArrowRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, CheckCircle2, Circle, FileText, Gift, MapPin, Network, Search, UsersRound } from "lucide-react"
import type { DashboardView, DashboardViewProps } from "@/components/dashboard/dashboard-shell"

export function OverviewView({ member, data, onNavigate }: DashboardViewProps) {
  const completion = profileCompletion(member, data.profile)
  const enrolledCount = data.enrollments.filter((enrollment) => enrollment.status === "enrolled").length
  const upcomingCourses = data.courses.filter((course) => course.eventDate).slice(0, 3)
  const nextSteps: { label: string; done: boolean; view: DashboardView }[] = [
    { label: "Complete your professional profile", done: completion.percent === 100, view: "profile" },
    { label: "Sign up for an Institute course", done: data.enrollments.length > 0, view: "institute" },
    { label: "Browse opportunities in the Network", done: false, view: "network" },
  ]

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section className="relative overflow-hidden rounded-2xl border border-[#dcb567]/20 bg-[linear-gradient(110deg,#102536,#0b1b29_65%,#172e40)] px-5 py-6 shadow-[0_18px_50px_rgba(3,15,25,0.18)] sm:px-8 sm:py-8">
        <div className="relative z-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-[#f3d27a]">Distinguished Daniel Network &amp; Institute</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-white sm:text-4xl">Welcome back, <span className="text-[#f3d27a]">{member.name.split(" ")[0]}</span></h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Raising Distinguished Daniel, Building Kingdom Influence, dignified impact continues. Learn, connect and prepare to make an impact in the marketplace.</p>
          </div>
          <blockquote className="border-l border-[#dcb567]/35 pl-5 text-sm leading-5 text-foreground/90">“But the people who know their God shall be strong, strong, and carry out great exploits,”<cite className="mt-1 block text-xs not-italic text-muted-foreground">Daniel 11:32 (NETV)</cite></blockquote>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} value={enrolledCount} label="My Enrolled Courses" detail="View courses" loading={data.loading} onClick={() => onNavigate("institute")} />
        <StatCard icon={CalendarDays} value={upcomingCourses.length} label="Upcoming Sessions" detail="View calendar" loading={data.loading} onClick={() => onNavigate("institute")} />
        <StatCard icon={Gift} value={data.resources.length} label="Certificates Earned" detail="View certificate" loading={data.loading} onClick={() => onNavigate("history")} />
        <button type="button" onClick={() => onNavigate("profile")} className="dashboard-card-hover flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left">
          <div className="relative grid size-14 shrink-0 place-items-center rounded-full border-4 border-[#dcb567]/30 text-xs font-semibold text-[#f3d27a]" style={{ background: `conic-gradient(#dcb567 ${completion.percent}%, #263847 0)` }}><span className="grid size-10 place-items-center rounded-full bg-card">{completion.percent}%</span></div>
          <span className="min-w-0"><strong className="block truncate text-sm font-medium text-foreground">Profile Completion</strong><span className="text-sm text-[#f3d27a]">{completion.percent}%</span></span>
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Panel icon={BookOpen} title="My Learning Journey" action={<ViewAll onClick={() => onNavigate("institute")} />}>
          {data.loading ? <ListSkeleton /> : data.courses.length === 0 ? <EmptyState icon={BookOpen} title="New courses are on the way" description="Courses published by the Institute will appear here." /> : data.courses.slice(0, 1).map((course) => {
            const enrollment = enrollmentFor(data.enrollments, course.id)
            return <div key={course.id} className="flex flex-col gap-3"><div className="overflow-hidden rounded-xl border border-border bg-background/30"><div className="grid gap-3 sm:grid-cols-[132px_1fr]"><div className="h-32 bg-[#162d3d] sm:h-auto sm:min-h-36">{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-[#f3d27a]"><BookOpen /></div>}</div><div className="flex flex-col justify-center gap-1 py-3 pr-3"><h3 className="font-medium text-foreground">{course.title}</h3><p className="text-xs text-muted-foreground">{course.category}</p><p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays /> {course.eventDate ? formatDate(course.eventDate) : "Course access"}</p><p className="text-xs text-muted-foreground"><MapPin className="mr-1 inline" /> {course.instructor || "DDNI Institute"}</p></div></div></div><Button className="btn-gold w-full rounded-full" onClick={() => onNavigate("institute")}>{enrollment?.status === "enrolled" ? "Continue Learning" : "View Course"}<ArrowRight data-icon="inline-end" /></Button></div>
          })}
        </Panel>

        <Panel icon={CalendarDays} title="Upcoming Courses & Events" action={<ViewAll onClick={() => onNavigate("institute")} />}>
          {upcomingCourses.length === 0 ? <EmptyState icon={CalendarDays} title="No upcoming sessions" description="New Institute sessions will appear here." /> : upcomingCourses.map((course) => <button type="button" key={course.id} onClick={() => onNavigate("institute")} className="flex items-center gap-3 border-b border-border pb-3 text-left last:border-0 last:pb-0"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#dcb567]/10 text-center text-xs text-[#f3d27a]"><b>{course.eventDate ? new Date(course.eventDate).getDate() : "—"}</b></span><span className="min-w-0"><strong className="block truncate text-sm font-medium text-foreground">{course.title}</strong><span className="text-xs text-muted-foreground">{course.eventDate ? formatDate(course.eventDate, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }) : "In-Person"}</span></span></button>)}
          <Button variant="ghost" className="mt-1 w-full text-xs text-[#f3d27a]" onClick={() => onNavigate("institute")}>View full calendar <ArrowRight data-icon="inline-end" /></Button>
        </Panel>

        <Panel icon={Bell} title="Announcements" action={<ViewAll onClick={() => onNavigate("network")} />}>
          {data.opportunities.slice(0, 3).map((item) => <button type="button" key={item.id} onClick={() => onNavigate("network")} className="flex gap-3 border-b border-border pb-3 text-left last:border-0 last:pb-0"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#dcb567]/10 text-[#f3d27a]"><Bell /></span><span className="min-w-0"><strong className="block text-sm font-medium text-foreground">{item.title}</strong><span className="line-clamp-2 text-xs text-muted-foreground">{item.description || relativeTime(item.createdAt)}</span></span></button>)}
          {data.opportunities.length === 0 && <EmptyState icon={Bell} title="No announcements yet" />}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={UsersRound} title="My Network" action={<ViewAll onClick={() => onNavigate("network")} />}><div className="flex items-center gap-3"><div className="flex -space-x-2">{data.directory.slice(0, 4).map((person) => <div key={person.id} className="grid size-10 place-items-center rounded-full border-2 border-card bg-[#dcb567]/20 text-xs text-[#f3d27a]">{person.name.slice(0, 2).toUpperCase()}</div>)}<div className="grid size-10 place-items-center rounded-full border-2 border-card bg-[#dcb567]/20 text-xs text-[#f3d27a]">+{Math.max(5, data.directory.length)}</div></div><p className="text-xs text-muted-foreground">Connect with other distinguished people, with, vote, share, and grow together.</p></div><Button className="btn-gold mt-4 w-full rounded-full" onClick={() => onNavigate("network")}>Explore the Network <ArrowRight data-icon="inline-end" /></Button></Panel>
        <Panel icon={BriefcaseBusiness} title="Opportunities" action={<ViewAll onClick={() => onNavigate("network")} />}><div className="flex flex-col gap-2">{data.opportunities.slice(0, 2).map((item) => <button key={item.id} type="button" onClick={() => onNavigate("network")} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left"><span><strong className="block text-sm text-foreground">{item.title}</strong><span className="text-xs text-muted-foreground">DDNI Network · {relativeTime(item.createdAt)}</span></span><ArrowRight /></button>)}{data.opportunities.length === 0 && <p className="text-sm text-muted-foreground">New opportunities will appear here.</p>}</div></Panel>
        <Panel icon={FileText} title="Resource Library" action={<ViewAll onClick={() => onNavigate("institute")} />}><div className="grid grid-cols-3 gap-2">{data.resources.slice(0, 3).map((resource) => <button key={resource.id} type="button" onClick={() => onNavigate("institute")} className="flex min-h-24 flex-col justify-between rounded-lg bg-[#162d3d] p-3 text-left"><span className="line-clamp-3 text-xs font-medium text-foreground">{resource.title}</span><span className="text-[10px] text-[#f3d27a]">{resource.type || "PDF"}</span></button>)}{data.resources.length === 0 && <p className="col-span-3 text-sm text-muted-foreground">Your resources will appear here.</p>}</div></Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]"><Panel icon={CheckCircle2} title="Your next steps">{nextSteps.map((step) => <button key={step.label} type="button" onClick={() => onNavigate(step.view)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent/40">{step.done ? <CheckCircle2 className="text-[#f3d27a]" /> : <Circle className="text-muted-foreground" />}<span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>{step.label}</span><ArrowRight className="ml-auto text-muted-foreground" /></button>)}</Panel><Panel icon={Search} title="Profile strength"><div className="flex items-end justify-between"><span className="text-3xl font-semibold text-[#f3d27a]">{completion.percent}%</span><span className="text-xs text-muted-foreground">{completion.missing.length} to go</span></div><Progress value={completion.percent} className="mt-3 h-1.5" /><Button variant="outline" className="mt-4 w-full" onClick={() => onNavigate("profile")}>Update profile</Button></Panel></div>
    </div>
  )
}

function Panel({ icon: Icon, title, action, children }: { icon: typeof BookOpen; title: string; action?: ReactNode; children: ReactNode }) { return <Card className="overflow-hidden border-border/80 shadow-sm"><CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/60 pb-3"><CardTitle className="flex min-w-0 items-center gap-2 text-base"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#dcb567]/10"><Icon className="text-[#f3d27a]" /></span><span className="truncate">{title}</span></CardTitle>{action}</CardHeader><CardContent className="flex flex-col gap-3 pt-4">{children}</CardContent></Card> }
function ViewAll({ onClick }: { onClick: () => void }) { return <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onClick}>View all <ArrowRight data-icon="inline-end" /></Button> }
function ListSkeleton() { return <>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</> }
function StatCard({ icon: Icon, value, label, detail, loading, onClick }: { icon: typeof BookOpen; value: number; label: string; detail: string; loading: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className="dashboard-card-hover flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-left"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#dcb567]/10 text-[#f3d27a]"><Icon /></span><span className="min-w-0"><strong className="block text-xl leading-none text-foreground">{loading ? "—" : value}</strong><span className="mt-1 block truncate text-sm text-foreground">{label}</span><span className="block text-xs text-[#dcb567]">{detail} <ArrowRight className="inline size-3" /></span></span></button> }
