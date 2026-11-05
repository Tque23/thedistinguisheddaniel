"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusMessage } from "@/components/dashboard/dashboard-ui"
import { SUPPORT_EMAIL, formatDate, type Course, type CourseEnrollment } from "@/lib/dashboard-data"
import { catalogCourse } from "@/lib/courses"
import { BookOpen, CalendarDays, Clock, MapPin, UserRound } from "lucide-react"

function accessCopy(course: Course, status: string | undefined) {
  if (status === "enrolled") return course.isFree ? "You’re registered. You have immediate access to this free course." : "Access granted. You’re confirmed for this course."
  if (status === "pending") return "Sign-up received. An administrator will grant access after payment is confirmed."
  if (status === "revoked") return "Access was revoked. You can request access again."
  return course.isFree ? "Sign up to get immediate access." : "Sign up to request access. An administrator will confirm paid enrolment."
}

export function CourseDetailsSheet({ course, enrollment, onClose, onRequestCourseAccess }: {
  course: Course | null
  enrollment: CourseEnrollment | undefined
  onClose: () => void
  onRequestCourseAccess: (course: Course) => Promise<string | null>
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const catalog = catalogCourse(course?.slug)
  const cover = catalog?.image || course?.thumbnailUrl

  async function signUp(target: Course) {
    setBusy(true)
    setMessage("")
    const error = await onRequestCourseAccess(target)
    setBusy(false)
    setMessage(error || (target.isFree ? "You now have access to this course." : "Sign-up received. We’ll grant access once payment is confirmed."))
  }

  function close() {
    setMessage("")
    onClose()
  }

  return (
    <Sheet open={course !== null} onOpenChange={(open) => { if (!open) close() }}>
      <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md">
        {course && (
          <>
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#132c40] to-[#0c1e2c]">
              {cover ? <img src={cover} alt="" className="size-full object-cover object-top" /> : <div className="grid size-full place-items-center"><BookOpen className="size-10 text-[#f3d27a]/60" /></div>}
            </div>
            <SheetHeader className="gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="w-fit text-xs">{course.isFree ? "Free" : "Paid"}</Badge>
                {enrollment?.status === "enrolled" && <Badge className="w-fit text-xs">Access granted</Badge>}
                {enrollment?.status === "pending" && <Badge variant="secondary" className="w-fit text-xs">Awaiting access</Badge>}
              </div>
              <SheetTitle className="font-display text-xl">{course.title}</SheetTitle>
              <SheetDescription className="whitespace-pre-line">{course.description || catalog?.description || "Full course details will be shared by the Institute team."}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground">
              {course.instructor && <p className="flex items-center gap-2"><UserRound className="size-4 text-[#f3d27a]" />{course.instructor}</p>}
              {course.eventDate && <p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#f3d27a]" />{formatDate(course.eventDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) || course.eventDate}</p>}
              {course.duration && <p className="flex items-center gap-2"><Clock className="size-4 text-[#f3d27a]" />{course.duration}</p>}
              {course.price && <p className="flex items-center gap-2"><span className="text-[#f3d27a]">{course.price}</span></p>}
            </div>
            {catalog?.formats.length ? (
              <div className="flex flex-col gap-3 px-4">
                {catalog.formats.map((format) => (
                  <div key={format.label} className="rounded-xl border border-border p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#dcb567]">{format.label}</p>
                      <p className="text-sm font-medium">{format.price}</p>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li className="flex gap-2"><CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[#f3d27a]" />{format.seating}</li>
                      <li className="flex gap-2"><Clock className="mt-0.5 size-3.5 shrink-0 text-[#f3d27a]" />{format.time}</li>
                      <li className="flex gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#f3d27a]" />{format.location.value}</li>
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="px-4 text-sm text-muted-foreground">{accessCopy(course, enrollment?.status)}</p>
            {message && <div className="px-4"><StatusMessage tone={message.startsWith("Unable") || message.startsWith("Please") ? "error" : "success"}>{message}</StatusMessage></div>}
            <SheetFooter>
              {enrollment?.status === "enrolled" ? (
                <Button className="btn-gold" disabled>You have access</Button>
              ) : enrollment?.status === "pending" ? (
                <Button className="btn-gold" disabled>Awaiting admin access</Button>
              ) : (
                <Button className="btn-gold" disabled={busy} onClick={() => void signUp(course)}>
                  {busy ? "Signing up…" : course.isFree ? "Sign up for free access" : enrollment?.status === "revoked" ? "Request access again" : "Sign up"}
                </Button>
              )}
              {!course.isFree && enrollment?.status !== "enrolled" && (
                <Button variant="outline" render={<a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Proof of payment: ${course.title}`)}`} />}>Send proof of payment</Button>
              )}
              <Button variant="outline" onClick={close}>Close</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
