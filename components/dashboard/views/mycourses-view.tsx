"use client"

import { useMemo, useState } from "react"
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock, FileText, MapPin, PlayCircle, Star, UserRound, Users2 } from "lucide-react"
import { catalogCourse } from "@/lib/courses"
import { enrollmentFor, type Course, type CourseEnrollment } from "@/lib/dashboard-data"
import { courseCalendarSessions, courseCodeFor, formatSessionDate, formatTimeRange, type Session } from "@/lib/ddni-schedule"
import { CourseCover, DdniButton, EmptyPanel, LoadingBlock, Panel, Pill, SegmentedTabs, TextLink, type TabItem } from "@/components/dashboard/ddni-ui"
import { CourseDetailsSheet } from "@/components/dashboard/course-details-sheet"
import { CourseLearningWorkspace } from "@/components/dashboard/course-learning-workspace"
import { ViewContainer, ViewHeader } from "@/components/dashboard/dashboard-ui"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type Status = "in-progress" | "registered" | "pending" | "completed" | "available"
type TabId = "all" | "progress" | "completed" | "available"

type CourseItem = {
  course: Course
  enrollment: CourseEnrollment | undefined
  image: string
  code: string
  sessions: Session[]
  completedSessions: number
  lessonCount: number
  nextLessonTitle: string | null
  status: Status
  upcoming: Session | undefined
  tagline: string
}

function buildItem(course: Course, enrollment: CourseEnrollment | undefined, now: Date, scheduledSessions: Session[], lessonCount: number, completedSessions: number, nextLessonTitle: string | null): CourseItem {
  const catalog = catalogCourse(course.slug)
  const sessions = [...scheduledSessions].sort((a, b) => a.start.getTime() - b.start.getTime())
  const started = sessions.length > 0 && sessions[0].start.getTime() <= now.getTime()
  let status: Status = "available"
  if (enrollment?.status === "enrolled") {
    if (lessonCount > 0 && completedSessions === lessonCount) status = "completed"
    else status = started || completedSessions > 0 ? "in-progress" : "registered"
  } else if (enrollment?.status === "pending") status = "pending"
  return {
    course,
    enrollment,
    image: catalog?.image || course.thumbnailUrl,
    code: courseCodeFor(course.slug),
    sessions,
    completedSessions,
    lessonCount,
    nextLessonTitle,
    status,
    upcoming: sessions.find((session) => session.end.getTime() >= now.getTime()),
    tagline: catalog?.tagline ?? "",
  }
}

const statusPill: Record<Status, { label: string; tone: "gold" | "blue" | "green" | "gray" | "navy" }> = {
  "in-progress": { label: "In Progress", tone: "gold" },
  registered: { label: "Registered", tone: "blue" },
  pending: { label: "Awaiting access", tone: "gray" },
  completed: { label: "Completed", tone: "navy" },
  available: { label: "Available", tone: "green" },
}

function InfoRow({ icon: Icon, children }: { icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-foreground/85">
      <Icon className="size-4 shrink-0 text-[#0c1d3a]" aria-hidden />
      <span className="min-w-0">{children}</span>
    </li>
  )
}

function CourseCard({ item, now, onOpen, onContinue }: { item: CourseItem; now: Date; onOpen: () => void; onContinue: () => void }) {
  const { course, sessions, status, completedSessions, lessonCount } = item
  const pill = statusPill[status]
  const joined = status === "in-progress" || status === "registered" || status === "completed"
  const first = sessions[0]
  const modeLabel = first ? (first.mode === "online" ? "Online" : "In-person") : "Format to be announced"
  const startsLabel = first
    ? `${first.start.getTime() <= now.getTime() ? "Started" : "Starts"} ${formatSessionDate(first.start)}`
    : "Schedule to be announced"
  const sessionsLabel = lessonCount
    ? joined ? `${completedSessions} of ${lessonCount} lessons complete` : `${lessonCount} lessons`
    : sessions.length
      ? `${sessions.length} scheduled sessions`
    : course.duration || "Sessions TBA"
  const progress = lessonCount ? Math.round((completedSessions / lessonCount) * 100) : 0

  return (
    <article className="ddni-card ddni-card-hover flex flex-col gap-6 p-6">
      <div className="flex gap-4">
        <div className="w-[7.25rem] shrink-0 sm:w-32">
          <CourseCover title={course.title} code={item.code} image={item.image} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Pill tone={pill.tone}>{status === "registered" && <span className="size-1.5 rounded-full bg-[#2f568f]" aria-hidden />}{status === "available" && <span className="size-1.5 rounded-full bg-[#1f7a43]" aria-hidden />}{pill.label}</Pill>
          <h3 className="ddni-serif text-lg leading-snug font-bold text-foreground sm:text-xl">{course.title}</h3>
          <p className="text-xs text-muted-foreground">{[item.code && `Course ${item.code}`, course.instructor].filter(Boolean).join(" · ")}</p>
          <hr className="my-1 border-border" />
          <ul className="flex flex-col gap-1.5">
            <InfoRow icon={UserRound}>{modeLabel}</InfoRow>
            <InfoRow icon={CalendarDays}>{startsLabel}</InfoRow>
            <InfoRow icon={Clock}>{sessionsLabel}</InfoRow>
            {first && <InfoRow icon={MapPin}>{first.location}</InfoRow>}
          </ul>
        </div>
      </div>

      {joined && lessonCount > 0 ? (
        <div className="rounded-lg border border-border bg-[#fcfaf5] p-3">
          <div className="flex items-center justify-between text-sm font-semibold text-foreground"><span>Course Progress</span><span>{progress}%</span></div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#ece7d9]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${course.title} progress`}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#b8893a] to-[#d4ad5c] transition-[width] duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
          {item.nextLessonTitle && <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Next lesson:</span> {item.nextLessonTitle}</p>}
        </div>
      ) : course.isFree && status === "available" ? (
        <p className="text-sm font-semibold text-[#1f7a43]">Free Course</p>
      ) : null}

      <div className="mt-auto">
        {status === "in-progress" || status === "completed" ? (
          <DdniButton size="lg" className="w-full" onClick={onContinue}>{status === "completed" ? "Review Materials" : "Continue Learning"}<ArrowRight /></DdniButton>
        ) : joined || status === "pending" ? (
          <DdniButton variant="outline" size="lg" className="w-full" onClick={onOpen}>View Course<ArrowRight /></DdniButton>
        ) : (
          <DdniButton size="lg" className="w-full" onClick={onOpen}>Register<ArrowRight /></DdniButton>
        )}
      </div>
    </article>
  )
}

function InfoLine({ icon: Icon, children }: { icon: typeof UserRound; children: React.ReactNode }) {
  return <li className="flex items-center gap-2 text-sm text-foreground/85"><Icon className="size-4 shrink-0 text-[#0c1d3a]" aria-hidden />{children}</li>
}

export function MyCoursesView({ data, onNavigate, onRequestCourseAccess, onSetSessionCompletion, onSubmitCourseAssessment }: DashboardViewProps) {
  const [tab, setTab] = useState<TabId>("all")
  const [selected, setSelected] = useState<Course | null>(null)
  const now = useMemo(() => new Date(), [])

  const items = useMemo(
    () => data.courses.map((course) => {
      const courseSessions = data.sessions
        .filter((session) => session.courseId === course.id)
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      const scheduledSessions = courseCalendarSessions(data.courses, courseSessions)
      const completed = new Set(data.sessionCompletions.map((completion) => completion.sessionId))
      const next = courseSessions.find((session) => !completed.has(session.id))
      return buildItem(
        course,
        enrollmentFor(data.enrollments, course.id),
        now,
        scheduledSessions,
        courseSessions.length,
        courseSessions.filter((session) => completed.has(session.id)).length,
        next?.title ?? null,
      )
    }),
    [data.courses, data.enrollments, data.sessions, data.sessionCompletions, now],
  )

  const counts = {
    all: items.length,
    progress: items.filter((item) => item.status === "in-progress").length,
    completed: items.filter((item) => item.status === "completed").length,
    available: items.filter((item) => item.status !== "in-progress" && item.status !== "completed").length,
  }
  const tabs: TabItem<TabId>[] = [
    { id: "all", label: "All Courses", icon: BookOpen, count: counts.all },
    { id: "progress", label: "In Progress", icon: PlayCircle, count: counts.progress },
    { id: "completed", label: "Completed", icon: CheckCircle2, count: counts.completed },
    { id: "available", label: "Available Courses", icon: FileText, count: counts.available },
  ]

  const visible = items.filter((item) => {
    if (tab === "progress") return item.status === "in-progress"
    if (tab === "completed") return item.status === "completed"
    if (tab === "available") return item.status !== "in-progress" && item.status !== "completed"
    return true
  })

  const nextItem = useMemo(() => {
    const joined = items.filter((item) => (item.status === "in-progress" || item.status === "registered") && item.upcoming)
    const pool = joined.length ? joined : items.filter((item) => item.upcoming)
    return [...pool].sort((a, b) => a.upcoming!.start.getTime() - b.upcoming!.start.getTime())[0]
  }, [items])
  const recommended = items.filter((item) => item.status === "available" || item.status === "registered").slice(0, 3)
  const selectedEnrollment = selected ? enrollmentFor(data.enrollments, selected.id) : undefined

  if (selected && selectedEnrollment?.status === "enrolled") {
    return (
      <ViewContainer>
        <CourseLearningWorkspace
          course={selected}
          paths={data.learningPaths}
          sessions={data.sessions}
          materials={data.materials}
          assessments={data.assessments}
          questions={data.assessmentQuestions}
          attempts={data.assessmentAttempts}
          answers={data.assessmentAnswers}
          completions={data.sessionCompletions}
          learningError={data.errors.learning}
          onBack={() => setSelected(null)}
          onSetSessionCompletion={onSetSessionCompletion}
          onSubmitAssessment={onSubmitCourseAssessment}
        />
      </ViewContainer>
    )
  }

  return (
    <ViewContainer>
      <ViewHeader kicker="Member learning" title="My Courses" description="Continue your journey of growth and distinction." />

      <SegmentedTabs label="Course filters" items={tabs} value={tab} onChange={setTab} />

      {data.errors.courses && <p role="alert" className="text-sm text-[#b3261e]">{data.errors.courses}</p>}
      {data.errors.enrollments && <p role="alert" className="text-sm text-[#b3261e]">{data.errors.enrollments}</p>}

      {data.loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <LoadingBlock key={i} className="h-96" />)}</div>
      ) : visible.length === 0 ? (
        <EmptyPanel
          icon={BookOpen}
          title={items.length ? "No courses in this view yet" : "Courses are being prepared"}
          description={items.length ? "Courses you start or complete will appear here. Browse the available courses to get going." : "New courses from the Institute will appear here as soon as they are published."}
          action={items.length ? <DdniButton onClick={() => setTab("available")}>Browse available courses</DdniButton> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <CourseCard key={item.course.id} item={item} now={now} onOpen={() => setSelected(item.course)} onContinue={() => setSelected(item.course)} />
          ))}
        </div>
      )}

      {!data.loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Panel title="Next Session" icon={CalendarDays} action={<TextLink onClick={() => onNavigate("calendar")}>View calendar<ArrowRight className="size-4" /></TextLink>}>
            {nextItem?.upcoming ? (
              <div className="flex gap-4 rounded-lg border border-border/60 bg-card p-6">
                <div className="w-24 shrink-0 sm:w-28"><CourseCover title={nextItem.course.title} code={nextItem.code} image={nextItem.image} /></div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {nextItem.code && <Pill tone="blue" className="bg-[#e9eef8]">Course {nextItem.code}</Pill>}
                  <h4 className="ddni-serif text-lg leading-snug font-bold text-foreground">{nextItem.course.title} – Session {nextItem.upcoming.number}</h4>
                  {nextItem.tagline && <p className="text-sm text-muted-foreground">{nextItem.tagline}</p>}
                  <ul className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <InfoLine icon={CalendarDays}>{formatSessionDate(nextItem.upcoming.start)}</InfoLine>
                    <InfoLine icon={Clock}>{formatTimeRange(nextItem.upcoming)}</InfoLine>
                    <InfoLine icon={MapPin}>{nextItem.upcoming.location}</InfoLine>
                    <InfoLine icon={Users2}>{nextItem.upcoming.mode === "online" ? "Online" : "In-person"}</InfoLine>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No upcoming sessions are scheduled yet.</p>
            )}
          </Panel>

          <Panel title="Recommended for You" icon={Star} action={<TextLink onClick={() => setTab("available")}>View all<ArrowRight className="size-4" /></TextLink>}>
            {recommended.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">You are all caught up. New recommendations will appear here.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {recommended.map((item) => (
                  <div key={item.course.id} className="ddni-card-hover flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-6">
                    <div className="flex gap-3">
                      <div className="w-14 shrink-0"><CourseCover title={item.course.title} code={item.code} image={item.image} /></div>
                      <div className="min-w-0">
                        <h4 className="ddni-serif text-sm leading-snug font-bold text-foreground">{item.course.title}</h4>
                        {item.code && <p className="mt-0.5 text-xs text-muted-foreground">Course {item.code}</p>}
                      </div>
                    </div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.tagline || item.course.description}</p>
                    <TextLink onClick={() => setSelected(item.course)} className="mt-auto self-start text-[#8a6420] underline underline-offset-4">Learn more<ArrowRight className="size-3.5" /></TextLink>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      <CourseDetailsSheet
        course={selected}
        enrollment={selectedEnrollment}
        onClose={() => setSelected(null)}
        onRequestCourseAccess={onRequestCourseAccess}
      />
    </ViewContainer>
  )
}
