import { COURSES } from "@/lib/courses"

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

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

function parseSeating(seating: string) {
  const match = seating.match(/^(.*?)\s+([A-Za-z]+)\s+(\d{4})$/)
  if (!match) return null
  const days = match[1].match(/\d+/g)?.map(Number) ?? []
  const month = MONTHS.indexOf(match[2].toLowerCase())
  if (!days.length || month < 0) return null
  return { days, month, year: Number(match[3]) }
}

function parseTime(time: string) {
  const match = time.match(/(\d{1,2})h(\d{2})\D+?(\d{1,2})h(\d{2})/)
  if (!match) return { startHour: 19, startMinute: 0, endHour: 21, endMinute: 0 }
  return { startHour: Number(match[1]), startMinute: Number(match[2]), endHour: Number(match[3]), endMinute: Number(match[4]) }
}

function buildSessions(): Session[] {
  const sessions: Session[] = []
  for (const course of COURSES) {
    const courseCode = course.description.match(/Course Code:\s*(\d+)/)?.[1] ?? ""
    course.formats.forEach((format, formatIndex) => {
      const seating = parseSeating(format.seating)
      if (!seating) return
      const time = parseTime(format.time)
      const online = /online/i.test(format.label)
      seating.days.forEach((day, index) => {
        sessions.push({
          id: `${course.id}-${formatIndex}-${index + 1}`,
          courseSlug: course.id,
          courseTitle: course.title,
          courseCode,
          formatIndex,
          number: index + 1,
          total: seating.days.length,
          start: new Date(seating.year, seating.month, day, time.startHour, time.startMinute),
          end: new Date(seating.year, seating.month, day, time.endHour, time.endMinute),
          mode: online ? "online" : "in-person",
          location: online ? "Online (MS Teams)" : "KAN Apostolic Hub",
          price: format.price,
        })
      })
    })
  }
  return sessions.sort((a, b) => a.start.getTime() - b.start.getTime())
}

export const SESSIONS: Session[] = buildSessions()

export function primarySessions(courseSlug: string) {
  return SESSIONS.filter((session) => session.courseSlug === courseSlug && session.formatIndex === 0)
}

export function courseCodeFor(courseSlug: string) {
  return SESSIONS.find((session) => session.courseSlug === courseSlug)?.courseCode
    ?? COURSES.find((course) => course.id === courseSlug)?.description.match(/Course Code:\s*(\d+)/)?.[1]
    ?? ""
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
