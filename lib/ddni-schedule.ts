import { COURSES } from "@/lib/courses"
import type { Course, CourseSession } from "@/lib/dashboard-data"

export type Session = {
  id: string
  courseSlug: string
  courseTitle: string
  courseCode: string
  formatIndex: number
  number: number
  total: number
  start: Date
  end: Date
  mode: "in-person" | "online"
  location: string
  price: string
}

export function courseCalendarSessions(courses: Course[], courseSessions: CourseSession[]): Session[] {
  const coursesById = new Map(courses.map((course) => [course.id, course]))
  const totals = new Map<string, number>()
  courseSessions.forEach((session) => totals.set(session.courseId, (totals.get(session.courseId) ?? 0) + 1))

  return courseSessions.flatMap((session) => {
    if (!session.startsAt || !session.endsAt) return []
    const start = new Date(session.startsAt)
    const end = new Date(session.endsAt)
    const course = coursesById.get(session.courseId)
    if (!course || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
    return [{
      id: session.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      courseCode: courseCodeFor(course.slug),
      formatIndex: 0,
      number: session.position + 1,
      total: totals.get(course.id) ?? 1,
      start,
      end,
      mode: session.deliveryMode,
      location: session.location || (session.deliveryMode === "online" ? "Online" : "Location to be announced"),
      price: course.price,
    }]
  }).sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function courseCodeFor(courseSlug: string) {
  return COURSES.find((course) => course.id === courseSlug)?.description.match(/Course Code:\s*(\d+)/)?.[1] ?? ""
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const two = (value: number) => String(value).padStart(2, "0")

export function formatTimeRange(session: Session) {
  return `${two(session.start.getHours())}:${two(session.start.getMinutes())} – ${two(session.end.getHours())}:${two(session.end.getMinutes())}`
}

export function formatSessionDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export function sessionTitle(session: Session) {
  return `${session.courseTitle} – Session ${session.number}`
}

const icsStamp = (date: Date) =>
  `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}T${two(date.getHours())}${two(date.getMinutes())}00`

export function buildIcs(sessions: Session[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DDNI//Learner Portal//EN", "CALSCALE:GREGORIAN"]
  for (const session of sessions) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${session.id}@ddni`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(session.start)}`,
      `DTEND:${icsStamp(session.end)}`,
      `SUMMARY:${sessionTitle(session)}`,
      `LOCATION:${session.location}`,
      "END:VEVENT",
    )
  }
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadIcs(sessions: Session[], filename: string) {
  const blob = new Blob([buildIcs(sessions)], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
