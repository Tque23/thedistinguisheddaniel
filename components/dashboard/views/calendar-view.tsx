"use client"

import { useMemo, useState } from "react"
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Users2, Video } from "lucide-react"
import { catalogCourse } from "@/lib/courses"
import { cn } from "@/lib/utils"
import { courseCalendarSessions, downloadIcs, formatSessionDate, formatTimeRange, sameDay, sessionTitle, type Session } from "@/lib/ddni-schedule"
import { CourseCover, DdniButton, Panel, TextLink } from "@/components/dashboard/ddni-ui"
import { ViewContainer, ViewHeader } from "@/components/dashboard/dashboard-ui"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type Mode = "month" | "week" | "list"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
const startOfWeek = (date: Date) => addDays(startOfDay(date), -date.getDay())

function SessionChip({ session, compact }: { session: Session; compact?: boolean }) {
  const online = session.mode === "online"
  const Icon = online ? Video : BookOpen
  return (
    <div
      title={`${sessionTitle(session)} · ${formatTimeRange(session)} · ${session.location}`}
      className={cn(
        "flex min-w-0 gap-1.5 rounded-md px-1.5 py-1 text-start text-xs leading-tight",
        online ? "bg-[#dbe6f5] text-[#10264a]" : "bg-gradient-to-b from-[#c4994a] to-[#a97b2b] text-white shadow-sm",
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className={cn("block font-semibold", compact ? "truncate" : "line-clamp-2")}>{session.courseTitle}</span>
        <span className={cn("block", online ? "text-[#10264a]/75" : "text-white/85")}>{formatTimeRange(session).replace(" – ", "-")}</span>
        {online && <span className="block text-[#10264a]/75">Online</span>}
      </span>
    </div>
  )
}

function DateTile({ date }: { date: Date }) {
  return (
    <span className="grid w-12 shrink-0 place-items-center rounded-md bg-[#eef0f5] py-1 text-center leading-none">
      <span className="text-xs font-semibold tracking-wide text-[#0c1d3a] uppercase">{date.toLocaleDateString("en-GB", { month: "short" })}</span>
      <span className="ddni-serif text-xl font-bold text-[#0c1d3a]">{date.getDate()}</span>
    </span>
  )
}

export function CalendarView({ data, onNavigate }: DashboardViewProps) {
  const now = useMemo(() => new Date(), [])
  const scheduledSessions = useMemo(
    () => courseCalendarSessions(data.courses, data.sessions),
    [data.courses, data.sessions],
  )
  const enrolledSlugs = useMemo(() => {
    const enrolledIds = new Set(data.enrollments.filter((enrollment) => enrollment.status === "enrolled").map((enrollment) => enrollment.courseId))
    return new Set(data.courses.filter((course) => enrolledIds.has(course.id)).map((course) => course.slug))
  }, [data.courses, data.enrollments])

  const upcoming = useMemo(() => scheduledSessions.filter((session) => session.end.getTime() >= now.getTime()), [scheduledSessions, now])
  const nextSession = useMemo(() => upcoming.find((session) => enrolledSlugs.has(session.courseSlug)) ?? upcoming[0], [upcoming, enrolledSlugs])

  const initial = nextSession?.start ?? now
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [anchor, setAnchor] = useState(() => startOfDay(initial))
  const [mode, setMode] = useState<Mode>("month")

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const weekStart = startOfWeek(anchor)

  function shift(direction: -1 | 1) {
    if (mode === "week") {
      const next = addDays(anchor, direction * 7)
      setAnchor(next)
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
      return
    }
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1)
    setCursor(next)
    setAnchor(next)
  }

  function goToday() {
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setAnchor(startOfDay(now))
  }

  function focusSession(session: Session) {
    setCursor(new Date(session.start.getFullYear(), session.start.getMonth(), 1))
    setAnchor(startOfDay(session.start))
  }

  const eventsOn = (day: Date) => scheduledSessions.filter((session) => sameDay(session.start, day))

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const rows = Math.ceil((first.getDay() + daysInMonth) / 7)
    const start = addDays(first, -first.getDay())
    return Array.from({ length: rows * 7 }, (_, index) => addDays(start, index))
  }, [cursor])

  const monthEvents = scheduledSessions.filter((session) => session.start.getFullYear() === cursor.getFullYear() && session.start.getMonth() === cursor.getMonth())
  const nextCatalog = nextSession ? catalogCourse(nextSession.courseSlug) : undefined
  const nextCourseSessions = nextSession ? scheduledSessions.filter((session) => session.courseSlug === nextSession.courseSlug && session.formatIndex === nextSession.formatIndex) : []

  return (
    <ViewContainer>
      <ViewHeader kicker="Member schedule" title="My Calendar" description="Course dates come from the same lessons managed in the course outline." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="ddni-card min-w-0 p-6" aria-label="Calendar">
          <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <button type="button" onClick={() => shift(-1)} aria-label={mode === "week" ? "Previous week" : "Previous month"} className="ddni-btn grid size-10 shrink-0 place-items-center rounded-lg border border-input bg-card text-foreground shadow-sm hover:bg-muted sm:size-11"><ChevronLeft className="size-5" /></button>
              <h3 className="ddni-serif min-w-0 flex-1 text-center text-base font-bold text-foreground sm:min-w-40 sm:px-1 sm:text-2xl" aria-live="polite">{monthLabel}</h3>
              <button type="button" onClick={() => shift(1)} aria-label={mode === "week" ? "Next week" : "Next month"} className="ddni-btn grid size-10 shrink-0 place-items-center rounded-lg border border-input bg-card text-foreground shadow-sm hover:bg-muted sm:size-11"><ChevronRight className="size-5" /></button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:ms-auto sm:gap-3">
              <div role="group" aria-label="Calendar view" className="inline-flex overflow-hidden rounded-lg border border-input bg-card shadow-sm">
                {(["month", "week", "list"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => setMode(option)}
                    className={cn("min-h-11 px-2 text-sm font-medium capitalize transition-colors sm:px-4", mode === option ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted")}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button type="button" onClick={goToday} className="ddni-btn min-h-11 rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground hover:bg-muted sm:px-4">Today</button>
            </div>
          </div>

          {mode === "month" && (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-7 bg-muted/70 text-center text-xs font-semibold text-foreground sm:text-sm">
                {WEEKDAYS.map((day) => <div key={day} className="border-r border-border py-2.5 last:border-r-0">{day}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const inMonth = day.getMonth() === cursor.getMonth()
                  const events = eventsOn(day)
                  const today = sameDay(day, now)
                  return (
                    <div key={day.toISOString()} className={cn("min-h-14 min-w-0 border-t border-r border-border p-1 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-muted/40")}>
                      <span className={cn("ddni-serif inline-grid size-6 place-items-center rounded-full text-sm font-semibold sm:size-7 sm:text-base", inMonth ? "text-foreground" : "text-muted-foreground/50", today && "bg-[#0c1d3a] text-white")}>{day.getDate()}</span>
                      {inMonth && (
                        <>
                          <div className="mt-1 hidden flex-col gap-1 sm:flex">{events.map((session) => <SessionChip key={session.id} session={session} compact />)}</div>
                          <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                            {events.map((session) => <span key={session.id} className={cn("size-2 rounded-full", session.mode === "online" ? "bg-[#7ea3d6]" : "bg-[#b8893a]")} />)}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {mode === "month" && (
            <ul className="mt-4 flex flex-col divide-y divide-border rounded-xl border border-border sm:hidden">
              <li className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{monthLabel} sessions</li>
              {monthEvents.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">No sessions scheduled for this month.</li>}
              {monthEvents.map((session) => (
                <li key={session.id} className="flex items-start gap-3 p-3">
                  <DateTile date={session.start} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{sessionTitle(session)}</p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{formatTimeRange(session)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{session.location}</span>
                      <span>{session.mode === "online" ? "Online" : "In-person"}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {mode === "week" && (
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-7">
              {Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map((day) => {
                const events = eventsOn(day)
                return (
                  <div key={day.toISOString()} className="min-h-20 border-b border-border p-2 last:border-b-0 sm:min-h-64 sm:border-r sm:border-b-0 sm:last:border-r-0">
                    <p className={cn("mb-2 text-xs font-semibold text-muted-foreground", sameDay(day, now) && "text-[#8a6420]")}>
                      {day.toLocaleDateString("en-GB", { weekday: "short" })} <span className="ddni-serif text-base text-foreground">{day.getDate()}</span>
                    </p>
                    <div className="flex flex-col gap-1.5">{events.map((session) => <SessionChip key={session.id} session={session} />)}</div>
                  </div>
                )
              })}
            </div>
          )}

          {mode === "list" && (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {monthEvents.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No sessions scheduled for {monthLabel}.</li>}
              {monthEvents.map((session) => (
                <li key={session.id} className="flex items-center gap-3 p-3">
                  <DateTile date={session.start} />
                  <div className="min-w-0 flex-1">
                    <p className="ddni-serif truncate text-base font-bold text-foreground">{sessionTitle(session)}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{formatTimeRange(session)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{session.location}</span>
                    </p>
                  </div>
                  <span className={cn("hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline", session.mode === "online" ? "bg-[#dbe6f5] text-[#10264a]" : "bg-[#f5ecd6] text-[#8a6420]")}>{session.mode === "online" ? "Online" : "In-person"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Session details">
          <Panel title="Your Next Session" icon={CalendarDays}>
            {nextSession ? (
              <>
                <div className="flex gap-4">
                  <div className="w-24 shrink-0"><CourseCover title={nextSession.courseTitle} code={nextSession.courseCode} image={nextCatalog?.image} /></div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h4 className="ddni-serif text-lg leading-snug font-bold text-foreground">{nextSession.courseTitle}</h4>
                    <p className="text-xs text-muted-foreground">Course {nextSession.courseCode}</p>
                    <hr className="my-1 border-border" />
                    <ul className="flex flex-col gap-1.5 text-sm text-foreground/85">
                      <li className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0" aria-hidden />{formatSessionDate(nextSession.start)}</li>
                      <li className="flex items-center gap-2"><Clock className="size-4 shrink-0" aria-hidden />{formatTimeRange(nextSession)}</li>
                      <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden />{nextSession.location}</li>
                      <li className="flex items-center gap-2"><Users2 className="size-4 shrink-0" aria-hidden />{nextSession.mode === "online" ? "Online" : "In-person"}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  <DdniButton size="lg" className="w-full" onClick={() => onNavigate("courses")}>View Course<ChevronRight /></DdniButton>
                  <DdniButton variant="outline" size="lg" className="w-full" onClick={() => downloadIcs(nextCourseSessions, `${nextSession.courseSlug}.ics`)}><CalendarDays />Add to My Calendar</DdniButton>
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">There are no upcoming sessions scheduled.</p>
            )}
          </Panel>

          <Panel title="Calendar Legend" icon={CalendarDays} className="[&_svg]:text-[#a9792a]">
            <ul className="flex flex-col gap-3">
              {[
                { color: "bg-[#b8893a]", title: "Course Session", text: "DDNI course session (in-person)" },
                { color: "bg-[#0c1d3a]", title: "DDNI Event", text: "Special event or network activity" },
                { color: "bg-[#a9c1e4]", title: "Online Event", text: "Virtual session (online)" },
              ].map((entry) => (
                <li key={entry.title} className="flex items-start gap-3">
                  <span className={cn("mt-1 size-5 shrink-0 rounded-full", entry.color)} aria-hidden />
                  <span><span className="block text-sm font-semibold text-foreground">{entry.title}</span><span className="block text-xs text-muted-foreground">{entry.text}</span></span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Upcoming Sessions" icon={CalendarDays} action={<TextLink onClick={() => { setMode("list"); if (upcoming[0]) focusSession(upcoming[0]) }} className="text-xs">View all<ChevronRight className="size-3.5" /></TextLink>}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcoming.slice(0, 3).map((session) => (
                  <li key={session.id}>
                    <button type="button" onClick={() => { setMode("month"); focusSession(session) }} className="ddni-card-hover flex w-full items-center gap-3 rounded-lg border border-border bg-white p-2.5 text-left">
                      <DateTile date={session.start} />
                      <span className="min-w-0 flex-1">
                        <span className="ddni-serif block truncate text-sm font-bold text-foreground">{sessionTitle(session)}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3" aria-hidden />{formatTimeRange(session)}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden />{session.location}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-[#a9792a]" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </ViewContainer>
  )
}
