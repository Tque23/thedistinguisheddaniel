"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  learningPath,
  stats,
  type Opportunity,
} from "@/lib/dashboard-data"
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
} from "lucide-react"
import type { DashboardMember, DashboardView } from "@/components/dashboard/dashboard-shell"

export function OverviewView({
  onNavigate,
  opportunities,
  member,
}: {
  onNavigate: (view: DashboardView) => void
  opportunities: Opportunity[]
  member: DashboardMember
}) {
  const inProgress = learningPath.filter((m) => m.progress < 100)

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0c1e2c] via-[#0c1e2c] to-[#132c40] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-3">
          <Badge variant="outline" className="w-fit border-[#dcb567]/40 text-[#f3d27a]">
            {member.tier} Member{member.memberSince ? ` since ${member.memberSince}` : ""}
          </Badge>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            Welcome back, {member.name.split(" ")[0]}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            You have {inProgress.length} active learning{" "}
            {inProgress.length === 1 ? "module" : "modules"} and{" "}
            {opportunities.length} new opportunities waiting in The Network.
          </p>
        </div>
        <div
          aria-hidden
          className="absolute -right-12 -top-12 size-56 rounded-full bg-[#dcb567]/10 blur-3xl"
        />
      </div>

      {/* Stat widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Courses In Progress"
          value={stats.coursesInProgress}
        />
        <StatCard
          icon={Award}
          label="Certifications Earned"
          value={stats.certificationsEarned}
        />
        <StatCard
          icon={Briefcase}
          label="Opportunities Viewed"
          value={stats.opportunitiesViewed}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Continue learning */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-[#f3d27a]" />
              Continue Learning
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => onNavigate("institute")}
            >
              View all
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {inProgress.map((module) => (
              <div key={module.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {module.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {module.completedLessons}/{module.totalLessons} lessons
                  </span>
                </div>
                <Progress value={module.progress} className="h-1.5" />
                <span className="text-xs text-muted-foreground">
                  Next: {module.nextLesson}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunity preview */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4 text-[#f3d27a]" />
              Latest Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {opportunities.length > 0 ? opportunities.slice(0, 3).map((op) => (
              <div key={op.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-foreground leading-snug">{op.title}</span>
                <span className="text-xs text-muted-foreground">{op.postedBy} · {op.postedAt}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No opportunities have been published yet.</p>}
            <p className="text-xs text-muted-foreground">Published and managed by the DDNI administration team.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: number
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#dcb567]/10 text-[#f3d27a]">
          <Icon className="size-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  )
}
